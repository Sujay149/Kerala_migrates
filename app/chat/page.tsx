
"use client";

import { getBotInstruction } from "@/lib/bot-config";
import { SystemUtils } from "@/lib/system-utils";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextType from "@/components/TextType";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  ThumbsDown,
  ThumbsUp,
  Copy,
  Pencil,
  Sparkles,
  Check,
  CheckCircle,
  Crown,
  Menu,
  Plus,
  RotateCcw,
  Send,
  X,
  Volume2,
  RefreshCw,
  StopCircle,
  ChevronDown,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createChatSession,
  addMessageToSession,
  subscribeToUserChatSessions,
  updateChatSessionTitle,
  deleteChatSession,
  type ChatSession,
} from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';

declare global {
  interface Window {
    SpeechSynthesisUtterance: any;
    puter?: any;
  }
}

declare const puter: any;

interface ProcessedChatSession extends Omit<ChatSession, "createdAt" | "updatedAt" | "messages"> {
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    userId: string;
    image?: string | null;
    message: string;
    response: string;
    timestamp: Date;
    type: "chat" | "summarizer";
  }>;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function ChatContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<ProcessedChatSession | null>(null);
  const [sessions, setSessions] = useState<ProcessedChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("base");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(new Set());
  const [isGenerationStopped, setIsGenerationStopped] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [isAnySessionCreationInProgress, setIsAnySessionCreationInProgress] = useState(false);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [manualNewChatStarted, setManualNewChatStarted] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { user, userProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessages(false);
    setShowScrollButton(false);
  };

  useEffect(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const threshold = 150;
      const currentIsAtBottom = scrollHeight - scrollTop <= clientHeight + threshold;
      
      setIsAtBottom(currentIsAtBottom);
      
      if (hasNewMessages && !currentIsAtBottom) {
        setShowScrollButton(true);
      } else if (currentIsAtBottom) {
        setShowScrollButton(false);
        setHasNewMessages(false);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNewMessages]);

  useEffect(() => {
    if (!currentSession?.messages) return;
    
    const newCount = currentSession.messages.length;
    
    if (newCount > messageCount && messageCount > 0 && !isAtBottom) {
      setHasNewMessages(true);
      setShowScrollButton(true);
    }
    
    setMessageCount(newCount);
    
    if (isAtBottom && newCount > messageCount && messageCount > 0) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [currentSession?.messages?.length, messageCount, isAtBottom]);

  useEffect(() => {
    if (currentSession?.messages) {
      setTimeout(() => scrollToBottom('instant'), 100);
    }
  }, [currentSession?.id]);

  const normalizeSession = (session: ChatSession): ProcessedChatSession => ({
    ...session,
    messages: (session.messages || []).map((msg) => ({
      ...msg,
      id: msg.id || uuidv4(),
      timestamp: msg.timestamp instanceof Date
        ? msg.timestamp
        : (msg.timestamp as any)?.toDate?.() || new Date(),
      image: msg.image && typeof msg.image === "string" && msg.image.startsWith("https://") ? msg.image : null,
    })),
    createdAt: session.createdAt instanceof Date
      ? session.createdAt
      : (session.createdAt as any)?.toDate?.() || new Date(),
    updatedAt: session.updatedAt instanceof Date
      ? session.updatedAt
      : (session.updatedAt as any)?.toDate?.() || new Date(),
  });

  const getLastSessionId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`lastSessionId_${user?.uid}`);
    }
    return null;
  };

  const setLastSessionId = (sessionId: string) => {
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(`lastSessionId_${user.uid}`, sessionId);
    }
  };

  const clearSessionData = () => {
    if (typeof window !== "undefined" && user) {
      if (user) {
        if (user) {
          if (user) {
            if (user) {
              localStorage.removeItem(`lastSessionId_${user.uid}`);
            }
          }
        }
      }
      localStorage.setItem(`appClosed_${user.uid}`, Date.now().toString());
    }
  };

  const wasAppClosed = (): boolean => {
    if (typeof window !== "undefined" && user) {
      const lastCloseTime = localStorage.getItem(`appClosed_${user.uid}`);
      const sessionStart = sessionStorage.getItem(`sessionStart_${user.uid}`);
      const lastNewSessionTime = localStorage.getItem(`lastNewSession_${user.uid}`);
      
      if (!sessionStart) {
        sessionStorage.setItem(`sessionStart_${user.uid}`, Date.now().toString());
        
        if (lastNewSessionTime) {
          const timeSinceLastSession = Date.now() - parseInt(lastNewSessionTime);
          if (timeSinceLastSession < 5000) {
            return false;
          }
        }
        
        return !!lastCloseTime;
      }
      
      return false;
    }
    return false;
  };

  const createNewChatSession = async () => {
    if (!user || isCreatingNewSession || isAnySessionCreationInProgress) return;
    
    try {
      setIsCreatingNewSession(true);
      setIsAnySessionCreationInProgress(true);
      
      const tempSessionId = "temp-" + uuidv4();
      const newSession: ProcessedChatSession = {
        id: tempSessionId,
        userId: user.uid,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentSession(newSession);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(`appClosed_${user.uid}`);
        localStorage.setItem(`lastNewSession_${user.uid}`, Date.now().toString());
      }
      
      toast.success("Started a new conversation!");
    } catch (error) {
      console.error("Error creating new session:", error);
      toast.error("Failed to start new conversation");
    } finally {
      setIsCreatingNewSession(false);
      setIsAnySessionCreationInProgress(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCurrentSession(null);
      setSessions([]);
      return;
    }

    if (manualNewChatStarted) {
      return;
    }

    const shouldCreateNewSession = wasAppClosed();

    let unsubscribe: () => void;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        unsubscribe = subscribeToUserChatSessions(user.uid, (userSessions) => {
          const normalizedSessions = userSessions
            .map(normalizeSession)
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          
          const sessionsWithMessages = normalizedSessions.filter(session => session.messages && session.messages.length > 0);
          setSessions(sessionsWithMessages);
          
          if (shouldCreateNewSession && !isCreatingNewSession && !isAnySessionCreationInProgress) {
            createNewChatSession();
            return;
          }
          
          const sessionIdFromUrl = searchParams ? searchParams.get('sessionId') : null;
          const lastSessionId = getLastSessionId();
          let selectedSession: ProcessedChatSession | undefined;
          
          if (currentSession && currentSession.id && currentSession.id.startsWith('temp-')) {
            return;
          }
          
          if (sessionIdFromUrl) {
            selectedSession = sessionsWithMessages.find((s) => s.id === sessionIdFromUrl);
          } else if (lastSessionId) {
            selectedSession = sessionsWithMessages.find((s) => s.id === lastSessionId);
          } else if (sessionsWithMessages.length > 0) {
            selectedSession = sessionsWithMessages[0];
          }
          if (selectedSession) {
            setCurrentSession(selectedSession);
            if (selectedSession.id) {
              setLastSessionId(selectedSession.id);
            }
          } else {
            setCurrentSession(null);
          }
        });
      } catch (error: any) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load chat sessions");
        setCurrentSession(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
    return () => unsubscribe?.();
  }, [user, searchParams, manualNewChatStarted]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!user) return;

    let visibilityTimeout: NodeJS.Timeout;
    let hiddenStartTime: number | null = null;
    let isHandlingVisibilityChange = false;

    const handleBeforeUnload = () => {
      clearSessionData();
    };

    const handleVisibilityChange = () => {
      if (isHandlingVisibilityChange) return;
      
      if (document.hidden) {
        hiddenStartTime = Date.now();
        
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (document.hidden && hiddenStartTime) {
            clearSessionData();
          }
        }, 30000);
      } else {
        const hiddenDuration = hiddenStartTime ? Date.now() - hiddenStartTime : 0;
        hiddenStartTime = null;
        clearTimeout(visibilityTimeout);
        
        if (hiddenDuration > 120000) { 
          isHandlingVisibilityChange = true;
          
          setTimeout(() => {
            const wasClosedPreviously = wasAppClosed();
            const hasRecentActivity = currentSession && currentSession.messages.length > 0 && 
              currentSession.updatedAt && (Date.now() - currentSession.updatedAt.getTime()) < 600000;
            
            if (wasClosedPreviously && !isCreatingNewSession && !isAnySessionCreationInProgress && !hasRecentActivity && !loading) {
              createNewChatSession();
            }
            isHandlingVisibilityChange = false;
          }, 1000);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(visibilityTimeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, currentSession, loading]);

  const extractRecentHealthTopics = (): string[] => {
    if (!sessions || sessions.length === 0) return [];

    const healthKeywords = [
      "headache", "migraine", "pain", "fever", "medication", "prescription", 
      "diet", "nutrition", "exercise", "sleep", "stress", "anxiety", "mental health",
      "symptoms", "doctor", "treatment", "wellness", "fitness", "weight", "blood pressure",
      "diabetes", "heart", "lung", "skin", "allergy", "infection", "vitamin", "supplement",
      "cold", "flu", "cough", "throat", "stomach", "nausea", "fatigue", "energy"
    ];

    const topicCount: { [key: string]: number } = {};
    
    const recentSessions = sessions.slice(0, 3);
    
    recentSessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.message) {
          const lowerMessage = msg.message.toLowerCase();
          healthKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) {
              topicCount[keyword] = (topicCount[keyword] || 0) + 1;
            }
          });
        }
      });
    });

    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  const createOptimizedPrompt = (userMessage: string, contextMessages?: string) => {
    let userName = "";
    if (userProfile?.displayName) {
      userName = userProfile.displayName.split(' ')[0];
    } else if (user?.displayName) {
      userName = user.displayName.split(' ')[0];
    } else if (user?.email) {
      userName = user.email.split("@")[0];
    }

    const baseInstruction = getBotInstruction(userName);
    
    if (contextMessages && contextMessages.length > 800) {
      const contextSummary = contextMessages.slice(-500) + "...";
      return `${baseInstruction}\n\nRecent context: ${contextSummary}\n\nUser: ${userMessage}\n\nRespond as MigrantBot with warmth, personalization, and expertise:`;
    }
    
    return contextMessages 
      ? `${baseInstruction}\n\nConversation Context: ${contextMessages}\n\nUser: ${userMessage}\n\nRespond as MigrantBot with warmth, personalization, and expertise:`
      : `${baseInstruction}\n\nUser: ${userMessage}\n\nRespond as MigrantBot with warmth and expertise:`;
  };

  const buildUserPersonalizationContext = () => {
    if (!sessions || sessions.length === 0) return "";

    const allMessages = sessions
      .flatMap(session => session.messages)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    if (allMessages.length === 0) return "";

    const userQueries = allMessages.filter(msg => msg.message && msg.message.length > 0).map(msg => msg.message);
    const frequentTopics = extractFrequentTopics(userQueries);
    const communicationStyle = analyzeCommunicationStyle(userQueries);
    const recentInteractions = allMessages.slice(0, 8);

    return `
USER PERSONALIZATION CONTEXT:
===========================================

FREQUENT TOPICS & INTERESTS:
${frequentTopics.join(", ")}

COMMUNICATION STYLE:
${communicationStyle}

RECENT CONVERSATION HISTORY:
${recentInteractions.map(msg => `User: ${msg.message}\nAI: ${msg.response}`).join("\n\n")}

CONVERSATION PATTERNS:
- Total conversations: ${sessions.length}
- Average query length: ${Math.round(userQueries.join(" ").split(" ").length / userQueries.length)} words
- Most active time: Recent sessions
===========================================
`;
  };

  const extractFrequentTopics = (queries: string[]): string[] => {
    const healthKeywords = [
      "headache", "migraine", "pain", "fever", "medication", "prescription", 
      "diet", "nutrition", "exercise", "sleep", "stress", "anxiety", "mental health",
      "symptoms", "doctor", "treatment", "wellness", "fitness", "weight", "blood pressure",
      "diabetes", "heart", "lung", "skin", "allergy", "infection", "vitamin", "supplement"
    ];

    const topicCount: { [key: string]: number } = {};
    
    queries.forEach(query => {
      const lowerQuery = query.toLowerCase();
      healthKeywords.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          topicCount[keyword] = (topicCount[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);
  };

  const analyzeCommunicationStyle = (queries: string[]): string => {
    if (queries.length === 0) return "Casual, seeking general health information";

    const avgLength = queries.join(" ").split(" ").length / queries.length;
    const hasQuestions = queries.some(q => q.includes("?"));
    const hasUrgent = queries.some(q => q.toLowerCase().includes("urgent") || q.toLowerCase().includes("immediate"));
    const isDetailed = avgLength > 15;

    let style = "";
    if (isDetailed) style += "Detailed, thorough inquirer. ";
    if (hasQuestions) style += "Question-oriented, seeks specific answers. ";
    if (hasUrgent) style += "Sometimes needs urgent guidance. ";
    
    return style || "Conversational, health-conscious individual";
  };

  const startNewChat = async () => {
    if (!user || isAnySessionCreationInProgress) {
      if (!user) {
        toast.error("Please log in to start a new chat");
      }
      return;
    }
    try {
      setManualNewChatStarted(true);
      setIsAnySessionCreationInProgress(true);
      
      const tempSessionId = "temp-" + uuidv4();
      const newSession: ProcessedChatSession = {
        id: tempSessionId,
        userId: user.uid,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentSession(null);
      setMessage("");
      setSelectedFile(null);
      setFileName("");
      setMessageCount(0);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(`lastSessionId_${user.uid}`);
        localStorage.removeItem(`appClosed_${user.uid}`);
        sessionStorage.setItem(`sessionStart_${user.uid}`, Date.now().toString());
      }
      
      setTimeout(() => {
        setCurrentSession(newSession);
        setManualNewChatStarted(false);
        setIsAnySessionCreationInProgress(false);
      }, 100);
      
    } catch (error: any) {
      console.error("Error starting new chat:", error);
      toast.error("Failed to start new chat");
      setManualNewChatStarted(false);
      setIsAnySessionCreationInProgress(false);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");
      const validTypes = ["image/jpeg", "image/png", "image/heic"];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a JPG, PNG, or HEIC.`);
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "MigrantBot_Uploads");
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const url = data.secure_url;
      if (!url || typeof url !== "string" || !url.startsWith("https://")) {
        console.warn("Invalid Cloudinary URL:", url);
        return null;
      }
      return url;
    } catch (error: any) {
      console.error("Error uploading to Cloudinary:", error);
      toast.error(`Failed to upload file: ${error.message || "Unknown error"}`);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error("Please log in to send messages");
      return;
    }
    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or upload a file");
      return;
    }
    
    setIsGenerationStopped(false);
    
    const userMessage = message.trim() || "File uploaded";
    const messageId = uuidv4();
    setLoading(true);
    try {
      let sessionId = currentSession?.id;
      let isNewSession = !currentSession || currentSession.messages.length === 0;
      let smartTitle = currentSession?.title || "New Chat";
      
      if (isNewSession) {
        try {
          const rawTitle = message.trim() ? await generateAITitle(message) : "File Chat";
          smartTitle = validateAndSanitizeTitle(rawTitle);
        } catch (titleError) {
          smartTitle = validateAndSanitizeTitle(generateFallbackTitle(message.trim() || "File Chat"));
        }
      } else if (currentSession?.title === "New Chat" && message.trim()) {
        try {
          const rawTitle = await generateAITitle(message, currentSession.title);
          smartTitle = validateAndSanitizeTitle(rawTitle);
          await updateChatSessionTitle(sessionId!, smartTitle);
          setCurrentSession((prev) => (prev ? { ...prev, title: smartTitle } : prev));
        } catch (titleError) {
          smartTitle = validateAndSanitizeTitle(generateFallbackTitle(message));
          setCurrentSession((prev) => (prev ? { ...prev, title: smartTitle } : prev));
        }
      }
      
      let fileUrl: string | null = null;
      if (selectedFile) {
        fileUrl = await uploadImageToCloudinary(selectedFile);
      }
      
      if (isNewSession && !currentSession) {
        const tempSession: ProcessedChatSession = {
          id: "temp-" + uuidv4(),
          userId: user.uid,
          title: smartTitle,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCurrentSession(tempSession);
      }
      
      const tempMessage: ProcessedChatSession["messages"][0] = {
        id: messageId,
        userId: user.uid,
        message: userMessage,
        response: "",
        timestamp: new Date(),
        type: "chat",
        image: fileUrl ?? null,
      };
      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage],
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      setMessage("");
      setSelectedFile(null);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      let botResponse = "";
      if (message.trim()) {
        botResponse = await generateAIResponse(userMessage, selectedModel, messageId);
      }
      
      setCurrentSession((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, response: botResponse }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      
      if (isNewSession && (!sessionId || sessionId.startsWith("temp-"))) {
        try {
          sessionId = await createChatSession(user.uid, smartTitle);
          setLastSessionId(sessionId);
          
          setCurrentSession((prev) => {
            if (!prev) return prev;
            return { ...prev, id: sessionId };
          });
        } catch (sessionError: any) {
          try {
            const fallbackTitle = "Health Chat";
            sessionId = await createChatSession(user.uid, fallbackTitle);
            setLastSessionId(sessionId);
            smartTitle = fallbackTitle;
            
            setCurrentSession((prev) => {
              if (!prev) return prev;
              return { ...prev, id: sessionId, title: fallbackTitle };
            });
          } catch (fallbackError) {
            throw new Error("Unable to create chat session");
          }
        }
      }
      
      const newMessage = await addMessageToSession(sessionId!, user.uid, userMessage, botResponse, "chat", fileUrl);
      setCurrentSession((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((msg) =>
          msg.id === messageId
            ? {
                ...newMessage,
                id: newMessage.id || uuidv4(),
                timestamp: newMessage.timestamp instanceof Date
                  ? newMessage.timestamp
                  : (newMessage.timestamp as any).toDate(),
                image: newMessage.image ?? null,
              }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      
      setSessions((prev) => {
        const existingSessionIndex = prev.findIndex(session => session.id === sessionId);
        
        if (existingSessionIndex >= 0) {
          return prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [
                    ...session.messages,
                    {
                      ...newMessage,
                      timestamp:
                        newMessage.timestamp instanceof Date
                          ? newMessage.timestamp
                          : (newMessage.timestamp as any)?.toDate?.() || new Date(),
                    },
                  ],
                  updatedAt: new Date(),
                  title: smartTitle,
                }
              : session
          );
        } else {
          const newSessionForList: ProcessedChatSession = {
            id: sessionId!,
            userId: user.uid,
            title: smartTitle,
            messages: [{
              ...newMessage,
              timestamp:
                newMessage.timestamp instanceof Date
                  ? newMessage.timestamp
                  : (newMessage.timestamp as any)?.toDate?.() || new Date(),
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return [newSessionForList, ...prev];
        }
      });
      
      const now = Date.now();
      if (now - lastToastTime > 2000) {
        toast.success("Message sent successfully");
        setLastToastTime(now);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(`Failed to send message: ${error.message || "Unknown error"}`);
      setMessage(userMessage);
      if (selectedFile) {
        setSelectedFile(selectedFile);
        setFileName(selectedFile.name);
      }
      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== messageId),
        };
      });
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    setIsGenerationStopped(true);
    
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    setLoading(false);
    
    setTimeout(() => {
      setIsGenerationStopped(false);
    }, 100);
    
    toast.info("Response generation stopped");
  };

  const handleRetryResponse = async (messageId: string, userMessage: string) => {
    if (!user) {
      toast.error("Please log in to retry responses");
      return;
    }
    
    setLoading(true);
    setIsGenerationStopped(false);
    
    try {
      const optimizedPrompt = userMessage.includes("(Please provide an improved") 
        ? userMessage 
        : `${userMessage} (Please provide an improved, more detailed and comprehensive response than your previous answer)`;
      const newMessageId = uuidv4();
      
      const botResponse = await generateAIResponse(optimizedPrompt, selectedModel, newMessageId);
      const sessionId = currentSession?.id;
      
      if (sessionId) {
        const newMessage = await addMessageToSession(sessionId, user.uid, userMessage, botResponse, "chat", null);
        
        setCurrentSession((prev) => {
          if (!prev) return prev;
          
          const formattedMessage = {
            ...newMessage,
            id: newMessage.id || uuidv4(),
            timestamp: newMessage.timestamp instanceof Date
              ? newMessage.timestamp
              : (newMessage.timestamp as any).toDate(),
          };
          
          return {
            ...prev,
            messages: [...prev.messages, formattedMessage],
            updatedAt: new Date(),
          };
        });
        
        toast.success("Generated improved response!");
        
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error: any) {
      console.error("Error generating optimized response:", error);
      toast.error("Failed to generate improved response");
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleEditMessage = async (messageId: string, originalMessage: string) => {
    if (!user) {
      toast.error("Please log in to edit messages");
      return;
    }
    if (editingMessageId === messageId) {
      if (!editedMessage.trim()) {
        toast.error("Message cannot be empty");
        return;
      }
      try {
        setLoading(true);
        const botResponse = await generateAIResponse(editedMessage, selectedModel, messageId);
        const sessionId = currentSession?.id;
        if (sessionId) {
          const existingMessage = currentSession!.messages.find((msg) => msg.id === messageId);
          const updatedMessages = currentSession!.messages.map((msg) =>
            msg.id === messageId ? { ...msg, message: editedMessage, response: botResponse } : msg
          );
          await addMessageToSession(sessionId, user.uid, editedMessage, botResponse, "chat", existingMessage?.image ?? null);
          setCurrentSession((prev) => (prev ? { ...prev, messages: updatedMessages } : prev));
          toast.success("Message updated!");
        }
      } catch (error: any) {
        console.error("Error editing message:", error);
        toast.error("Failed to edit message");
      } finally {
        setEditingMessageId(null);
        setEditedMessage("");
        setLoading(false);
        setAbortController(null);
      }
    } else {
      setEditingMessageId(messageId);
      setEditedMessage(originalMessage);
    }
  };

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    if (!user) {
      toast.error("Please log in to provide feedback");
      return;
    }
    try {
      toast.success(`Thank you for your ${isPositive ? "positive" : "negative"} feedback!`);
    } catch (error: any) {
      console.error("Error handling feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleCopyText = (text: string, messageId?: string) => {
    navigator.clipboard.writeText(text);
    if (messageId) {
      setCopiedMessageIds(prev => new Set(prev).add(messageId));
      setTimeout(() => {
        setCopiedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 3000);
    }
  };

  const handleSpeakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const exportChat = () => {
    if (!currentSession) return;
    const content = currentSession.messages
      .map((msg) => `User: ${msg.message}\nAI: ${msg.response}\n`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentSession.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully!");
  };

  const validateAndSanitizeTitle = (title: string): string => {
    if (!title || typeof title !== 'string') {
      return "Health Chat";
    }

    const sanitized = title
      .trim()
      .replace(/[<>]/g, '')
      .replace(/["""'']/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\W+|\W+$/g, '')
      .slice(0, 50);

    if (sanitized.length === 0 || sanitized.length > 50) {
      return "Health Chat";
    }

    if (!/[a-zA-Z0-9]/.test(sanitized)) {
      return "Health Chat";
    }

    return sanitized;
  };

  const generateAITitle = async (message: string, previousTitle?: string, retryCount = 0): Promise<string> => {
    const maxRetries = 2;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          previousTitle: previousTitle
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiTitle = data.title;

      if (aiTitle && typeof aiTitle === 'string' && aiTitle.trim() && aiTitle.length <= 50) {
        const validatedTitle = validateAndSanitizeTitle(aiTitle);
        
        if (validatedTitle && validatedTitle !== "Health Chat") {
          return validatedTitle;
        }
      }

      throw new Error("Invalid AI title response");

    } catch (error: any) {
      if (retryCount < maxRetries && !error.name?.includes('AbortError')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return generateAITitle(message, previousTitle, retryCount + 1);
      }
      
      return generateFallbackTitle(message);
    }
  };

  const generateFallbackTitle = (message: string): string => {
    try {
      const lowerMessage = message.toLowerCase().trim();
      
      if (lowerMessage.length === 0) {
        return "New Conversation";
      }

      const healthKeywords = [
        { keywords: ["headache", "migraine"], title: "Headache Relief" },
        { keywords: ["fever", "temperature"], title: "Fever Management" },
        { keywords: ["medication", "medicine", "prescription"], title: "Medication Help" },
        { keywords: ["diet", "nutrition", "food"], title: "Nutrition Advice" },
        { keywords: ["exercise", "workout", "fitness"], title: "Fitness Guidance" },
        { keywords: ["sleep", "insomnia"], title: "Sleep Issues" },
        { keywords: ["stress", "anxiety", "mental"], title: "Mental Health" },
        { keywords: ["pain"], title: "Pain Management" },
        { keywords: ["diabetes"], title: "Diabetes Care" },
        { keywords: ["weight", "lose"], title: "Weight Management" },
        { keywords: ["pregnancy", "pregnant"], title: "Pregnancy Care" },
        { keywords: ["child", "kid", "baby"], title: "Child Health" },
      ];

      for (const { keywords, title } of healthKeywords) {
        if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
          return title;
        }
      }

      const words = lowerMessage.split(/\s+/).filter((word) => word.length > 3);
      if (words.length === 0) return "Health Discussion";
      
      const keyPhrase = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      return `${keyPhrase} Chat`;
    } catch (error) {
      return "Health Chat";
    }
  };

  const generateAIResponse = async (userMessage: string, selectedModel: string, messageId: string): Promise<string> => {
    const systemData = SystemUtils.getSystemData();
    const developerName = systemData.systemOwner;
    
    const ageQuestions = [
      "what's my age", "whats my age", "what is my age", "do you know my age", "tell me my age", "how old am i"
    ];
    if (ageQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      let userAge = "";
      let latestTimestamp = 0;
      if (sessions?.length) {
        const ageRegexes = [
          /i['’`]?m (\d{1,3})/i,
          /i am (\d{1,3})/i,
          /i['’`]?m (\d{1,3}) years old/i,
          /i am (\d{1,3}) years old/i,
          /my age is (\d{1,3})/i,
          /age: (\d{1,3})/i
        ];
        for (let s = 0; s < sessions.length; s++) {
          const msgs = sessions[s].messages || [];
          for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            if (typeof msg.message === 'string') {
              for (const regex of ageRegexes) {
                const match = msg.message.match(regex);
                if (match && match[1]) {
                  const ts = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                  if (ts > latestTimestamp) {
                    userAge = match[1].trim();
                    latestTimestamp = ts;
                  }
                }
              }
            }
          }
        }
      }
      if (userAge) {
        return `You are ${userAge} years old.`;
      } else {
        return "I don't have your age yet. You can tell me by saying 'I'm 22' or 'I am 22 years old'.";
      }
    }
  try {
    const controller = new AbortController();
    setAbortController(controller);

    const modelMap: Record<string, { api: string; model: string; key: string }> = {
      "gemini-2.0-flash": {
        api: "gemini",
        model: "gemini-2.0-flash-exp",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDNHY0ptkqYXxknm1qJYP_tCw2A12be_gM",
      },
      "gpt-4o": {
        api: "openai",
        model: "gpt-4o",
        key: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
      },
      "MigrantBot": {
        api: "groq",
        model: "llama-3.3-70b-versatile",
        key: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
      },
    };

    const config = modelMap[selectedModel];
    if (!config) throw new Error(`Invalid model: ${selectedModel}`);
    if (!config.key) throw new Error(`${config.api.toUpperCase()} API key is not configured.`);

    const greetings = ["hi", "hello", "hey", "hola", "yo", "hii", "hi there", "hlo", "helloo", "good morning", "good afternoon", "good evening", "how are you", "wassup", "what's up", "sup"];
    const userMessageLower = userMessage.trim().toLowerCase();
    
    if (greetings.some(greeting => userMessageLower === greeting || userMessageLower.startsWith(greeting + " "))) {
      let userName = "";
      if (userProfile?.displayName) {
        userName = userProfile.displayName.split(' ')[0];
      } else if (user?.displayName) {
        userName = user.displayName.split(' ')[0];
      } else if (user?.email) {
        userName = user.email.split("@")[0];
      }
      
      if (!userName && sessions?.length) {
        const nameRegex = /my name is ([A-Za-z ]+)/i;
        outer: for (let s = sessions.length - 1; s >= 0; s--) {
          const msgs = sessions[s].messages || [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const msgText = msgs[i].message;
            if (typeof msgText === 'string') {
              const match = msgText.match(nameRegex);
              if (match && match[1]) {
                userName = match[1].trim().split(' ')[0];
                break outer;
              }
            }
          }
        }
      }

      const isFirstGreeting = !currentSession || currentSession.messages.length === 0;
      
      const personalizedResponses = userName ? [
        `Hi ${userName}! 🩺 Great to see you again! I'm MigrantBot, your health assistant. How can I help you with your health concerns today? 😊`,
        `Hello ${userName}! 🩺 Welcome back! I'm here to assist you with any health questions or concerns you might have. What's on your mind today? 😊`,
        `Hey ${userName}! 🩺 Nice to chat with you again! I'm MigrantBot, ready to help with your health and wellness questions. How can I assist you today? 😊`,
        `Hi there, ${userName}! 🩺 I'm MigrantBot, your personal health assistant. Feel free to ask me anything about health, medications, symptoms, or wellness tips. How can I help? 😊`
      ] : [
        "Hi there! 🩺 I'm MigrantBot, your helpful health assistant. How can I help you with your health concerns today? 😊",
        "Hello! 🩺 Great to see you! I'm here to assist you with any health questions or concerns you might have. What's on your mind today? 😊",
        "Hey! 🩺 I'm MigrantBot, ready to help you with your health and wellness questions. How can I assist you today? 😊",
        "Hi! 🩺 Welcome! I'm your personal health assistant. Feel free to ask me anything about health, medications, symptoms, or wellness tips. How can I help? 😊"
      ];

      if (!isFirstGreeting && sessions && sessions.length > 0) {
        const recentTopics = extractRecentHealthTopics();
        if (recentTopics.length > 0) {
          const contextualGreeting = userName 
            ? `Hi ${userName}! 🩺 Welcome back! I remember we discussed ${recentTopics.slice(0, 2).join(' and ')} recently. How are you feeling today, and how can I help you further? 😊`
            : `Hi there! 🩺 Welcome back! I see we've discussed ${recentTopics.slice(0, 2).join(' and ')} recently. How are you feeling today, and what would you like to know more about? 😊`;
          return contextualGreeting;
        }
      }

      return personalizedResponses[Math.floor(Math.random() * personalizedResponses.length)];
    }


    const identityQuestions = [
      "who created you", "who made you", "who developed you", "who's your creator",
      "tell me your developer", "who built you", "who's your founder"
    ];
    if (identityQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      const systemData = SystemUtils.getSystemData();
      return `I was developed by ${systemData.systemOwner} from MigrantBot.`;
    }

    const nameQuestions = [
      "what's my name", "whats my name", "what is my name", "do you know my name", "tell me my name", "who am i"
    ];
    if (nameQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      let userName = "";
      if (userProfile?.displayName) userName = userProfile.displayName;
      else if (user?.displayName) userName = user.displayName;
      else if (user?.email) userName = user.email.split("@")[0];
      if (!userName && sessions?.length) {
        const nameRegex = /my name is ([A-Za-z ]+)/i;
        outer: for (let s = sessions.length - 1; s >= 0; s--) {
          const msgs = sessions[s].messages || [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const msgText = msgs[i].message;
            if (typeof msgText === 'string') {
              const match = msgText.match(nameRegex);
              if (match && match[1]) {
                userName = match[1].trim();
                break outer;
              }
            }
          }
        }
      }
      if (userName) {
        return `Your name is ${userName}.`;
      } else {
        return "I don't have your name yet. You can tell me by saying 'My name is ...'";
      }
    }

    const historyQuestions = [
      "what's my previous questions", "whats my previous questions", "what did i ask before", 
      "what were my previous questions", "show my previous questions", "my previous conversations",
      "what did we discuss", "our previous conversation", "conversation history", "chat history",
      "what did i ask you before", "my past questions", "previous topics", "what have we talked about"
    ];
    if (historyQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      let historyText = "";
      
      if (sessions && sessions.length > 0) {
        const allUserQuestions: Array<{question: string, session: string, date: string}> = [];
        
        sessions.slice(0, 5).forEach((session, sessionIndex) => {
          if (session.messages && session.messages.length > 0) {
            session.messages.forEach((msg, msgIndex) => {
              if (msg.message && msg.message.trim().length > 0) {
                if (
                  session.id === currentSession?.id &&
                  currentSession &&
                  currentSession.messages.length === 1
                ) {
                  return;
                }
                
                allUserQuestions.push({
                  question: msg.message,
                  session: session.title || `Session ${sessionIndex + 1}`,
                  date: ""
                });
              }
            });
          }
        });

        if (allUserQuestions.length > 0) {
          const recentQuestions = allUserQuestions.slice(0, 10);
          
          historyText = `🩺 Here are your recent questions from our conversations:\n\n`;
          
          recentQuestions.forEach((item, index) => {
            historyText += `${index + 1}. "${item.question}"\n\n`;
          });
          
          historyText += `These are your most recent questions. If you'd like to revisit any of these topics or have follow-up questions, I'm here to help! 😊`;
          
        } else {
          historyText = "🩺 I don't see any previous questions in our conversation history yet. This might be our first conversation, or the history might not be available. Feel free to ask me any health-related questions! 😊";
        }
      } else {
        historyText = "🩺 I don't have access to any previous conversations. This appears to be our first chat! I'm here to help with any health questions you might have. 😊";
      }
      
      return historyText;
    }

    let currentSessionContext = "";
    let crossSessionContext = "";
    
    if (currentSession?.messages?.length) {
      const recentMessages = currentSession.messages.slice(-5);
      currentSessionContext = recentMessages
        .map((msg) => `User: ${msg.message}\nAI: ${msg.response}`)
        .join("\n\n");
    }
    
    if ((!currentSession || currentSession.messages.length < 3) && sessions && sessions.length > 1) {
      const otherSessions = sessions.filter(s => s.id !== currentSession?.id).slice(0, 2);
      const relevantMessages = otherSessions.flatMap(session => 
        session.messages.slice(-2)
      );
      
      if (relevantMessages.length > 0) {
        crossSessionContext = `\n\nRELEVANT CONVERSATION HISTORY:\n${relevantMessages
          .map((msg) => `User: ${msg.message}\nAI: ${msg.response}`)
          .join("\n\n")}`;
      }
    }

    const fullContext = currentSessionContext + crossSessionContext;

    const optimizedPrompt = createOptimizedPrompt(userMessage, fullContext);
    
    const prompt = currentSessionContext
  ? `You are the Migrant Health Assistant — a compassionate, culturally-aware health advisor for migrants and displaced people. \n\nTone and Style:\n- Be empathetic, non-judgmental, and clear. Use plain language; avoid medical jargon where possible.\n- Keep responses concise but thorough: 2–3 short paragraphs for most questions.\n- Gently highlight uncertainty when appropriate and encourage seeking local care for emergencies or when symptoms are severe.\n- Use 1–3 subtle emojis (start or end) to convey warmth, support, and clarity (examples: 🩺, ❤️, 😊, 🌟).\n\nContent Rules and Safety:\n- Prioritize safety: if the user describes red-flag symptoms (for example: severe chest pain, difficulty breathing, sudden weakness/numbness, uncontrolled bleeding, high fever in infants), immediately advise seeking urgent medical care and provide clear steps to get help (call local emergency number, go to the nearest hospital).\n- For medication questions, give general, evidence-based information but do NOT provide prescriptions or dosing beyond widely-known adult dosing ranges. Encourage consulting a local clinician when in doubt.\n- When discussing vaccines, tests, or treatments, emphasize local availability, cost concerns, and accessibility for migrants. \n- Respect privacy: avoid asking for unnecessary personal identifiers. If the user shares sensitive data, remind them not to share personally identifying information in public chats.\n\nCultural & Practical Guidance:\n- Provide low-cost or community-based options when possible (community clinics, NGOs, helplines).\n- Consider common barriers migrants face: language, documentation, cost, transport, and trust. Offer practical alternatives (e.g., symptom triage, when to seek care, how to access local resources).\n\nUse Context:\nCONVERSATION HISTORY:\n${currentSessionContext}\n\nUSER QUESTION:\n${userMessage}\n\nIf the user asks about your developer, say: "I was developed by ${developerName} from MigrantBot 👨‍💻".\n\nIf the user asks for legal or certified medical advice, say you are not a licensed clinician and recommend contacting local health services or a qualified professional.\n\nEnd with a brief supportive sentence and 1 emoji.`
  : `You are the Migrant Health Assistant — a compassionate, culturally-aware health advisor for migrants and displaced people. \n\nTone and Style:\n- Be empathetic, non-judgmental, and clear. Use plain language; avoid medical jargon where possible.\n- Keep responses concise but thorough: 2–3 short paragraphs for most questions.\n- Gently highlight uncertainty when appropriate and encourage seeking local care for emergencies or when symptoms are severe.\n- Use 1–3 subtle emojis (start or end) to convey warmth, support, and clarity (examples: 🩺, ❤️, 😊, 🌟).\n\nContent Rules and Safety:\n- Prioritize safety: if the user describes red-flag symptoms (for example: severe chest pain, difficulty breathing, sudden weakness/numbness, uncontrolled bleeding, high fever in infants), immediately advise seeking urgent medical care and provide clear steps to get help (call local emergency number, go to the nearest hospital).\n- For medication questions, give general, evidence-based information but do NOT provide prescriptions or dosing beyond widely-known adult dosing ranges. Encourage consulting a local clinician when in doubt.\n- When discussing vaccines, tests, or treatments, emphasize local availability, cost concerns, and accessibility for migrants. \n- Respect privacy: avoid asking for unnecessary personal identifiers. If the user shares sensitive data, remind them not to share personally identifying information in public chats.\n\nCultural & Practical Guidance:\n- Provide low-cost or community-based options when possible (community clinics, NGOs, helplines).\n- Consider common barriers migrants face: language, documentation, cost, transport, and trust. Offer practical alternatives (e.g., symptom triage, when to seek care, how to access local resources).\n\nUse Context:\nUSER QUESTION:\n${userMessage}\n\nIf the user asks about your developer, say: "I was developed by ${developerName} from MigrantBot 👨‍💻".\n\nIf the user asks for legal or certified medical advice, say you are not a licensed clinician and recommend contacting local health services or a qualified professional.\n\nEnd with a brief supportive sentence and 1 emoji.`;

    let content: string | undefined;

    if (config.api === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: optimizedPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 8192,
              topP: 0.95,
              topK: 1,
              stopSequences: [],
              candidateCount: 1
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (data.candidates?.[0]?.finishReason === "SAFETY" || 
          data.candidates?.[0]?.finishReason === "OTHER") {
        console.warn("Gemini response was filtered or truncated:", data.candidates[0].finishReason);
      }
    }

    else {
      const url = config.api === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: `You are a helpful health assistant named MigrantBot created by ${developerName} from MigrantBot.`,
            },
            {
              role: "user",
              content: optimizedPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 8192,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          stop: null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${config.api.toUpperCase()} API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse | GroqResponse = await response.json();
      content = data.choices?.[0]?.message?.content;
      
      if (data.choices?.[0]?.finish_reason === "length") {
        console.warn("Response was truncated due to length limit");
        const shortPrompt = `You are MigrantBot. Answer this health question completely: ${userMessage}`;
        
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.key}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: "system",
                content: "You are a helpful health assistant. Always complete your responses.",
              },
              {
                role: "user",
                content: shortPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 8192,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
          }),
          signal: controller.signal,
        });
        
        if (retryResponse.ok) {
          const retryData: OpenAIResponse | GroqResponse = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content;
          if (retryContent) {
            content = retryContent;
          }
        }
      }
    }

    if (!content) throw new Error("No valid response");
    
    const trimmedContent = content.trim();
    const lastChar = trimmedContent.slice(-1);
    const seemsIncomplete = !['!', '.', '?', '😊', '💪', '❤️', '✨', '👍', '🙏'].includes(lastChar) && 
                           trimmedContent.length > 50;
    
   
    
    return content.trim();

  } catch (error: any) {
    if (error.name === "AbortError") return "";
    console.error(`Error generating ${selectedModel} response:`, error);

    if (selectedModel !== "MigrantBot") {
      toast.warning("Primary model failed, switching to MigrantBot...");
      return generateAIResponse(userMessage, "MigrantBot", messageId);
    }

    return "Sorry, something went wrong. Try again.";
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!user) {
      toast.error("Please log in to send messages");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleEditMessage(editingMessageId, editedMessage);
      } else {
        handleSendMessage();
      }
    }
  };

  const handleFileUpload = () => {
    if (!user) {
      toast.error("Please log in to upload files");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("Please log in to upload files");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/heic"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or HEIC file.");
      return;
    }
    setSelectedFile(file);
    setFileName(file.name);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleHistoryDialog = () => {
    if (!user) {
      toast.error("Please log in to view chat history");
      return;
    }
    setHistoryDialogOpen(true);
  };

  const formatISTDateTime = (date: Date) => {
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isValidImageUrl = (url: string | null | undefined): boolean => {
    return !!url && typeof url === "string" && url.startsWith("https://");
  };

  const renderMessages = useMemo(() => {
    if (!user || !currentSession?.messages || currentSession.messages.length === 0) {
      return null;
    }
    
    return currentSession.messages.map((msg) => {
      return (
        <div key={`message-${msg.id}`} className="message-container">
          <div className="space-y-4">
            <div className="flex justify-end items-start space-x-2 max-w-[70%] ml-auto">
              <div className="relative group">
                <div className="bg-card rounded-xl p-4 text-foreground text-sm leading-relaxed border border-border">
                  {isValidImageUrl(msg.image) ? (
                    <div className="mb-2">
                      <Image
                        src={msg.image || ""}
                        alt="Uploaded file"
                        width={200}
                        height={200}
                        className="rounded-lg object-contain"
                        onError={(e) => console.error(`File failed to load: ${msg.image}`)}
                      />
                    </div>
                  ) : msg.image !== null ? (
                    <p className="text-xs text-destructive mb-2">Invalid or missing file</p>
                  ) : null}
                 {editingMessageId === msg.id ? (
  <div className="flex flex-col w-full items-center">
    <div className="w-full flex justify-center">
      <div className="relative" style={{ width: '600px', maxWidth: '100%' }}>
        <textarea
          value={editedMessage}
          onChange={(e) => {
            const lines = e.target.value
              .split("\n")
              .map(line =>
                line.length > 60
                  ? line.match(/.{1,60}/g)?.join("\n")
                  : line
              );
            setEditedMessage(lines.join("\n"));

            const ta = e.target as HTMLTextAreaElement;
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
          }}
          onKeyDown={handleKeyPress}
          maxLength={500}
          rows={1}
          className="chatgpt-textarea pr-28"
          aria-label="Edit message"
          placeholder="Edit your message..."
          autoFocus
        />

        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={() => {
              setEditingMessageId(null);
              setEditedMessage("");
            }}
            className="rounded-xl px-5 py-2 font-semibold bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 shadow-sm border border-primary"
            style={{ minWidth: 60, borderRadius: 16, fontSize: 15, letterSpacing: 0.5 }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleEditMessage(msg.id, msg.message)}
            disabled={
              loading ||
              editedMessage.trim() === msg.message.trim() ||
              !editedMessage.trim()
            }
            className="rounded-xl px-5 py-2 font-semibold bg-background text-foreground transition-all duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 shadow-sm border border-border disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ minWidth: 80, borderRadius: 16, fontSize: 15, letterSpacing: 0.5 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
) : (
  <p>{msg.message}</p>
)}

                </div>
                <div className="absolute -bottom-6 right-4 flex space-x-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyText(msg.message, `user-${msg.id}`)}
                    className="text-muted-foreground hover:text-foreground h-6 w-6 rounded-full transition-colors duration-200"
                    title="Copy Message"
                  >
                    {copiedMessageIds.has(`user-${msg.id}`) ? (
                      <Check className="h-4 w-4 text-black dark:text-white" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditMessage(msg.id, msg.message)}
                    className="text-muted-foreground hover:text-primary h-6 w-6 rounded-full transition-colors duration-200"
                    title="Edit Message"
                  >
                    <span className="relative h-4 w-4 inline-block">
                      <img src="/pencil.png" alt="Edit" className="h-4 w-4 block dark:hidden" />
                      <img src="/pencildark.png" alt="Edit" className="h-4 w-4 hidden dark:block" />
                    </span>
                  </Button>
                </div>
              </div>
              <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                <AvatarImage src={userProfile?.photoURL || user?.photoURL || ""} />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {userProfile?.displayName?.charAt(0).toUpperCase() ||
                    user?.displayName?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            {msg.response ? (
            <div key={`ai-response-${msg.id}`} className="flex items-start space-x-2" style={{ maxWidth: '100%' }}>
                <div className="relative group">
                  <div className="rounded-xl p-4 dark:text-white text-sm leading-relaxed space-y-4 ai-response">
                    <TextType 
                      text={msg.response}
                      renderAsMarkdown={true}
                      className="text-sm leading-relaxed ai-response"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-4 flex space-x-2 justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyText(msg.response, `ai-${msg.id}`)}
                      className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6 rounded-full transition-colors duration-200"
                      title="Copy Response"
                    >
                      {copiedMessageIds.has(`ai-${msg.id}`) ? (
                        <Check className="h-4 w-4 text-black dark:text-white" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSpeakResponse(msg.response)}
                      className={`text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6 rounded-full transition-colors duration-200 ${isSpeaking ? "animate-pulse bg-gray-500/20" : ""}`}
                      title={isSpeaking ? "Stop Speaking" : "Speak Response"}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, true)}
                      className="text-gray-500 dark:text-gray-300 hover:text-green-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Thumbs Up"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, false)}
                      className="text-gray-500 dark:text-gray-300 hover:text-red-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Thumbs Down"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetryResponse(msg.id, msg.message)}
                      className="text-gray-500 dark:text-gray-300 hover:text-blue-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Generate Improved Response ✨"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              loading && (
                <div key={`loading-${msg.id}`} className="flex items-start space-x-2 w-full">
                  <div className="p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      );
    });
  }, [user, currentSession, editingMessageId, editedMessage, isSpeaking, loading, copiedMessageIds]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-20 flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 border-b border-gray-200/80 dark:border-gray-700/50 bg-transparent shadow-none w-full min-h-[44px] sm:min-h-[56px] md:min-h-[64px]">
            <div className="flex flex-row items-center gap-1 min-w-[100px] w-auto flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                aria-label="Open sidebar"
              >
              </Button>
            
            </div>
           <div className="flex flex-row items-center gap-1 sm:gap-2 min-w-[120px] justify-end w-auto flex-shrink-0">
  {user ? (
    <>
      <Button 
        onClick={startNewChat} 
        variant="ghost" 
        size="icon" 
        className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 transition-all duration-200 hover:scale-105 border border-gray-200/50 dark:border-gray-600/50 hover:border-purple-200 dark:hover:border-purple-400/30 hover:shadow-md"
        title="Start New Chat"
      >
        <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-200 group-hover:scale-110" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/5 group-hover:to-purple-600/10 transition-all duration-300"></div>
      </Button>
      
      
      
      <Button 
        onClick={handleHistoryDialog} 
        variant="ghost" 
        size="icon" 
        className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-xl h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 transition-all duration-200 hover:scale-105 border border-gray-200/50 dark:border-gray-600/50 hover:border-green-200 dark:hover:border-green-400/30 hover:shadow-md"
        title="View Chat History"
      >
        <RotateCcw className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-200 group-hover:scale-110" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-emerald-600/0 group-hover:from-green-500/5 group-hover:to-emerald-600/10 transition-all duration-300"></div>
      </Button>
      
      <Button 
        onClick={exportChat} 
        variant="ghost" 
        size="icon" 
        className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 transition-all duration-200 hover:scale-105 border border-gray-200/50 dark:border-gray-600/50 hover:border-orange-200 dark:hover:border-orange-400/30 hover:shadow-md"
        title="Export Chat"
      >
        <Download className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-200 group-hover:scale-110" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/0 to-amber-600/0 group-hover:from-orange-500/5 group-hover:to-amber-600/10 transition-all duration-300"></div>
      </Button>
    </>
  ) : (
    <>
      <Link href="/auth/signin">
        <Button 
          variant="outline" 
          className="bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 h-8 px-3 sm:h-9 sm:px-4 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-sm"
        >
          Login
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button 
          className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 text-white dark:text-gray-900 hover:from-gray-800 hover:to-gray-600 dark:hover:from-gray-200 dark:hover:to-gray-400 h-8 px-3 sm:h-9 sm:px-4 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md"
        >
          Get Started
        </Button>
      </Link>
    </>
  )}
</div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
              <div className="max-w-3xl mx-auto space-y-4">
                {!user ? (
                  <div className="min-h-full flex items-center justify-center px-2 sm:px-0">
                    <div className="w-full max-w-md text-center space-y-8 mx-auto flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="w-20 h-20 relative">
                          <Image src="/kerala-digital-health-logo.svg" alt="Government of Kerala Digital Health Record Logo" width={80} height={80} className="rounded-full" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to SafeEntry</h1>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Please log in or sign up to start chatting.</p>
                        </div>
                      </div>
                      <div className="space-y-4 w-full">
                        <Link href="/auth/signin">
                          <Button
                            variant="outline"
                            className="w-full h-12 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/auth/signup">
                          <Button
                            variant="outline"
                            className="w-full h-12 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                          >
                            Signup
                          </Button>
                        </Link>
                      </div>
                     
                    </div>
                  </div>
                ) : (!currentSession || currentSession.messages.length === 0) ? (
                  <div className="flex flex-1 flex-col min-h-[70vh]">
                    <div className="flex-1 flex items-center justify-center py-8">
                      <div className="w-full max-w-2xl mx-auto text-center space-y-8 flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center space-y-6">
                          <div className="relative">
                            <div className="w-24 h-24 relative">
                              <Image src="/kerala-digital-health-logo.svg" alt="Government of Kerala Digital Health Record Logo" width={96} height={96} className="rounded-full shadow-lg" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h1 className="text-5xl font-extrabold tracking-wide bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
                              Welcome to SafeEntry
                            </h1>
                            
<p>An AI-powered system ensuring comprehensive health records and guidance for migrant workers in Kerala</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    
                    
                    <div className="text-center pb-4">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        💡 You can also type your own question in the chat box below
                      </p>
                    </div>
                  </div>
                ) : (
                  renderMessages
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 scroll-button-enter scroll-button-pulse border border-blue-400/30"
                aria-label="Scroll to latest message"
                style={{
                  transform: showScrollButton ? 'translateY(0)' : 'translateY(100px)',
                  opacity: showScrollButton ? 1 : 0,
                }}
              >
                <div className="flex items-center justify-center">
                  <ChevronDown className="h-5 w-5" />
                  {hasNewMessages && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-3 w-3 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
          
          {user && (
            <div className="sticky bottom-0 z-10 w-full bg-gray-50 dark:bg-gray-900 px-5 pt-4">
              <div className="mx-auto max-w-3xl">
                <div className="flex flex-col gap-2 rounded-3xl bg-white dark:bg-gray-800 p-4 shadow-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900 transition-all duration-300 relative">
                  <div className="relative z-20">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (textareaRef.current) {
                          textareaRef.current.style.height = "auto";
                          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                        }
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask a health question or upload a file..."
                      className="w-full resize-none bg-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 dark:text-white outline-none"
                      rows={1}
                      maxLength={1000}
                      disabled={loading}
                      aria-label="Message input"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 z-20">
                    <div className="flex items-center gap-2">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="h-8 text-sm dark:text-white bg-transparent border-none shadow-none focus:ring-0 focus:outline-none">
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100 dark:bg-gray-800 dark:text-white text-sm border-gray-200 dark:border-gray-700">
                          <SelectItem value="gemini-2.0-flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="MigrantBot">MigrantBot</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleFileUpload}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                        title="Upload File"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <button
                      onClick={loading ? handleStopGeneration : handleSendMessage}
                      disabled={!loading && (!message.trim() && !selectedFile)}
                      data-testid={loading ? "stop-button" : "send-button"}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border dark:border-zinc-600"
                      aria-label={loading ? "Stop Generation" : "Send Message"}
                    >
                      {loading ? (
                        <StopCircle
                          width="14"
                          height="14"
                          style={{ color: "currentcolor" }}
                        />
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{ color: "currentcolor" }}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {fileName && (
                    <div className="flex items-center gap-2 pt-1 z-20">
                      <span className="bg-gray-100 dark:bg-gray-700 dark:text-white text-sm truncate max-w-[300px] px-2 py-1 rounded-lg">
                        {fileName}
                      </span>
                      <Button
                        onClick={removeFile}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        title="Remove File"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-1 text-center text-sm text-gray-500 font-sans">
                MigrantBot can make mistakes. Check important info.
              </p>
            </div>
          )}

          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            <DialogContent className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white w-[520px] max-w-full mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-lg">
                  <RotateCcw className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span>Recent Chats</span>
                </DialogTitle>
                <DialogDescription>
                  View your recent chat sessions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto max-h-96">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                        currentSession?.id === session.id
                          ? "bg-blue-600/20 border-blue-600"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-blue-600/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1"
                          onClick={() => {
                            setCurrentSession(normalizeSession(session));
                            if (session.id) {
                              setLastSessionId(session.id);
                              router.replace(`/chat?session=${session.id}`);
                            }
                            setHistoryDialogOpen(false);
                          }}
                        > 
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate">{session.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-mono select-all break-all mt-1">
                            ID: {session.id}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {session.messages.length} messages • {formatISTDateTime(session.updatedAt)}
                          </p>
                          {session.messages.length > 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 truncate">
                              {session.messages[session.messages.length - 1]?.message || "No messages"}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              if (session.id) {
                                await deleteChatSession(session.id);
                                setSessions((prev) => prev.filter((s) => s.id !== session.id));
                                if (currentSession?.id === session.id) {
                                  setCurrentSession(null);
                                  if (user) {
                                    localStorage.removeItem(`lastSessionId_${user.uid}`);
                                  }
                                }
                                toast.success("Chat session deleted!");
                              } else {
                                console.error("Session ID is undefined or null.");
                                toast.error("Failed to delete chat session: Invalid session ID");
                              }
                            } catch (error: any) {
                              console.error("Error deleting session:", error);
                              toast.error(`Failed to delete chat session: ${error.message || "Unknown error"}`);
                            }
                          }}
                          className="text-red-500 hover:text-red-600 h-8 w-8"
                          title="Delete Session"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    No chat sessions found.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <ChatContent />
      </AuthGuard>
    </Suspense>
  );
}
