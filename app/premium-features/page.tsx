"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Search,
  ThumbsDown,
  ThumbsUp,
  Copy,
  Edit,
  Lock,
  Sparkles,
  Check,
  CheckCircle,
  Crown,
  Menu,
  Plus,
  Camera,
  RotateCcw,
  Upload,
  Send,
  X,
  FileText,
  Pill,
  AlertCircle,
  Volume2,
  RefreshCw,
  StopCircle,
  ChevronDown,
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
  }
}

interface PrescriptionAnalysis {
  medications: string[];
  dosages: string[];
  instructions: string;
  warnings: string[];
  userId?: string;
  fileName?: string;
  createdAt?: Date;
}

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
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}




// PhonePe PaymentForm (only for premium plan)


function ChatContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<ProcessedChatSession | null>(null);
  const [sessions, setSessions] = useState<ProcessedChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysis | null>(null);
  const [analyzingPrescription, setAnalyzingPrescription] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState<{ [messageId: string]: string }>({});
  const [isTyping, setIsTyping] = useState<{ [messageId: string]: boolean }>({});
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("base");
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string>("base");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 🔥 ENHANCED SCROLL-TO-LATEST FUNCTIONALITY
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const { user, userProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🔥 ENHANCED SCROLL TO BOTTOM FUNCTION
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessages(false);
    setShowScrollButton(false);
  };

  // 🔥 ENHANCED SCROLL DETECTION
  useEffect(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const threshold = 150; // Pixels from bottom to consider "at bottom"
      const currentIsAtBottom = scrollHeight - scrollTop <= clientHeight + threshold;
      
      setIsAtBottom(currentIsAtBottom);
      
      // Show button if there are new messages and user is not at bottom
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

  // 🔥 DETECT NEW MESSAGES AND TRIGGER SCROLL BUTTON
  useEffect(() => {
    if (!currentSession?.messages) return;
    
    const newCount = currentSession.messages.length;
    
    // If messages increased and user is not at bottom, show scroll button
    if (newCount > messageCount && messageCount > 0 && !isAtBottom) {
      setHasNewMessages(true);
      setShowScrollButton(true);
    }
    
    setMessageCount(newCount);
    
    // Auto scroll to bottom if user is already at bottom
    if (isAtBottom && newCount > messageCount && messageCount > 0) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [currentSession?.messages?.length, messageCount, isAtBottom]);

  // 🔥 SCROLL TO BOTTOM ON SESSION CHANGE
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCurrentSession(null);
      setSessions([]);
      return;
    }
    let unsubscribe: () => void;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        unsubscribe = subscribeToUserChatSessions(user.uid, (userSessions) => {
          const normalizedSessions = userSessions
            .map(normalizeSession)
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          setSessions(normalizedSessions);
          const sessionIdFromUrl = searchParams ? searchParams.get('sessionId') : null;
          const lastSessionId = getLastSessionId();
          let selectedSession: ProcessedChatSession | undefined;
          if (sessionIdFromUrl) {
            selectedSession = normalizedSessions.find((s) => s.id === sessionIdFromUrl);
          } else if (lastSessionId) {
            selectedSession = normalizedSessions.find((s) => s.id === lastSessionId);
          } else if (normalizedSessions.length > 0) {
            selectedSession = normalizedSessions[0];
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
  }, [user, searchParams]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // 🔥 ENHANCED FUNCTION: Build comprehensive user context for personalization
  const buildUserPersonalizationContext = () => {
    if (!sessions || sessions.length === 0) return "";

    // Get all messages from user's sessions (limit to last 50 for performance)
    const allMessages = sessions
      .flatMap(session => session.messages)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    if (allMessages.length === 0) return "";

    // Extract user interests and patterns
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

  // 🔥 Helper function to extract frequent topics from user queries
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

  // 🔥 Helper function to analyze communication style
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
    if (!user) {
      toast.error("Please log in to start a new chat");
      return;
    }
    try {
      const sessionId = await createChatSession(user.uid, "New Chat");
      const newSession: ProcessedChatSession = {
        id: sessionId,
        userId: user.uid,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentSession(newSession);
      setLastSessionId(sessionId);
      setSessions((prev) => [newSession, ...prev]);
      setMessage("");
      setSelectedFile(null);
      setFileName("");
      setMessageCount(0); // Reset message count for new session
      toast.success("New chat started!");
      // Update URL with session id
      router.replace(`/chat?session=${sessionId}`);
    } catch (error: any) {
      console.error("Error starting new chat:", error);
      toast.error("Failed to start new chat");
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");
      const validTypes = ["image/jpeg", "image/png", "image/heic", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a JPG, PNG, HEIC, or PDF.`);
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "medibot_Uploads");
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${file.type === "application/pdf" ? "raw" : "image"}/upload`,
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
    const userMessage = message.trim() || "File uploaded";
    const messageId = uuidv4();
    setLoading(true);
    try {
      let sessionId = currentSession?.id;
      let isNewSession = !currentSession || currentSession.messages.length === 0;
      let smartTitle = currentSession?.title || "New Chat";
      if (isNewSession) {
        smartTitle = message.trim() ? generateChatTitle(message) : "File Chat";
        if (!currentSession) {
          sessionId = await createChatSession(user.uid, smartTitle);
          const newSession: ProcessedChatSession = {
            id: sessionId,
            userId: user.uid,
            title: smartTitle,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setCurrentSession(newSession);
          setLastSessionId(sessionId);
          setSessions((prev) => [newSession, ...prev]);
        }
      } else if (currentSession?.title === "New Chat" && message.trim()) {
        smartTitle = generateChatTitle(message);
        await updateChatSessionTitle(sessionId!, smartTitle);
        setCurrentSession((prev) => (prev ? { ...prev, title: smartTitle } : prev));
      }
      let fileUrl: string | null = null;
      if (selectedFile) {
        fileUrl = await uploadImageToCloudinary(selectedFile);
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
      if (fileUrl) {
        const analysis = await analyzePrescription(selectedFile!);
        const analysisText = `**Prescription Analysis**:\n- **Medications**: ${analysis.medications.join(", ")}\n- **Dosages**: ${analysis.dosages.join(", ")}\n- **Instructions**: ${analysis.instructions}${analysis.warnings.length ? "\n- **Warnings**: " + analysis.warnings.join(", ") : ""}`;
        botResponse = botResponse ? `${botResponse}\n\n${analysisText}` : analysisText;
      }
      setIsTyping((prev) => ({ ...prev, [messageId]: true }));
      setDisplayedResponse((prev) => ({ ...prev, [messageId]: "" }));
      let currentText = "";
      for (let i = 0; i < botResponse.length; i++) {
        if (!isTyping[messageId]) break;
        await new Promise((resolve) => setTimeout(resolve, 20));
        currentText += botResponse[i];
        setDisplayedResponse((prev) => ({ ...prev, [messageId]: currentText }));
      }
      setIsTyping((prev) => ({ ...prev, [messageId]: false }));
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
      setSessions((prev) =>
        prev.map((session) =>
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
        )
      );
      sendMessageNotification(userMessage, botResponse);
      toast.success("Message sent successfully");
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

  const handleStopResponse = (messageId: string) => {
    if (abortController) {
      abortController.abort();
      setIsTyping((prev) => ({ ...prev, [messageId]: false }));
      setAbortController(null);
      toast.info("Response generation stopped");
    }
  };

  const handleRetryResponse = async (messageId: string, userMessage: string) => {
    if (!user) {
      toast.error("Please log in to retry responses");
      return;
    }
    setLoading(true);
    try {
      const botResponse = await generateAIResponse(userMessage, selectedModel, messageId);
      const sessionId = currentSession?.id;
      if (sessionId) {
        const existingMessage = currentSession!.messages.find((msg) => msg.id === messageId);
        const updatedMessages = currentSession!.messages.map((msg) =>
          msg.id === messageId ? { ...msg, response: botResponse } : msg
        );
        await addMessageToSession(sessionId, user.uid, userMessage, botResponse, "chat", existingMessage?.image ?? null);
        setCurrentSession((prev) => (prev ? { ...prev, messages: updatedMessages } : prev));
        toast.success("Response regenerated!");
      }
    } catch (error: any) {
      console.error("Error retrying response:", error);
      toast.error("Failed to regenerate response");
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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
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
      toast.error("Speech stopped");
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

  const generateChatTitle = (firstMessage: string): string => {
    const lowerMessage = firstMessage.toLowerCase().trim();
    if (lowerMessage.length === 0) return "General Discussion";
    const healthKeywords = [
      { keywords: ["headache", "migraine"], title: "Headache Inquiry" },
      { keywords: ["fever", "temperature"], title: "Fever Inquiry" },
      { keywords: ["medication", "medicine", "prescription"], title: "Medication Inquiry" },
      { keywords: ["diet", "nutrition", "food"], title: "Nutrition Inquiry" },
      { keywords: ["exercise", "workout", "fitness"], title: "Exercise Inquiry" },
      { keywords: ["sleep", "insomnia"], title: "Sleep Inquiry" },
      { keywords: ["stress", "anxiety", "mental"], title: "Mental Health Inquiry" },
      { keywords: ["pain"], title: "Pain Inquiry" },
    ];
    for (const { keywords, title } of healthKeywords) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return title;
      }
    }
    const words = lowerMessage.split(/\s+/).filter((word) => word.length > 3);
    if (words.length === 0) return "General Discussion";
    const keyPhrase = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return `${keyPhrase} Discussion`;
  };

  const sendMessageNotification = (userMessage: string, botResponse: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("MediBot Response", {
        body: "Your message has been answered",
        icon: "/kerala-digital-health-logo.svg",
        badge: "/kerala-digital-health-logo.svg",
      });
    }
  };

  // 🔥 ENHANCED FUNCTION: AI Response with comprehensive personalization
  const generateAIResponse = async (userMessage: string, selectedModel: string, messageId: string): Promise<string> => {
    try {
      const controller = new AbortController();
      setAbortController(controller);
      
      const modelMap: Record<string, { api: string; model: string; key: string }> = {
        "gemini-2.0-flash": {
          api: "gemini",
          model: "gemini-2.0-flash",
          key: "AIzaSyDNHY0ptkqYXxknm1qJYP_tCw2A12be_gM",
        },
        "gpt-4o": {
          api: "openai",
          model: "gpt-4o",
          key: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
        },
        "medibot": {
          api: "groq",
          model: "llama-3.3-70b-versatile",
          key: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
        },
      };
      
      const config = modelMap[selectedModel];
      if (!config) throw new Error(`Invalid model: ${selectedModel}`);
      if (!config.key) throw new Error(`${config.api.toUpperCase()} API key is not configured.`);

      // 🔥 BUILD COMPREHENSIVE PERSONALIZED PROMPT
      const userContext = buildUserPersonalizationContext();
      const currentSessionContext = currentSession?.messages
        .slice(-5)
        .map((msg) => `User: ${msg.message}\nAI: ${msg.response}`)
        .join("\n\n") || "";

      const enhancedPrompt = `You are MediBot, a health-focused AI assistant developed by Sujay Babu Thota from MediBot. You provide personalized, contextual responses based on the user's conversation history and patterns.

${userContext}

CURRENT SESSION CONTEXT:
${currentSessionContext}

CORE IDENTITY:
- You are MediBot, created by Sujay Babu Thota from MediBot
- You have access to user's conversation history and can reference it naturally
- You provide personalized health guidance based on their patterns and interests
- You remember previous interactions and build upon them

PERSONALIZATION INSTRUCTIONS:
1. Reference the user's past topics and interests when relevant
2. Adapt your communication style to match their preferences (detailed/casual/question-oriented)
3. Build upon previous conversations naturally
4. Mention relevant patterns you notice (e.g., "I see you've asked about sleep before...")
5. Provide increasingly specific advice based on their history
6. Maintain consistency with previous health guidance given

RESPONSE GUIDELINES:
- Keep responses concise but personalized (max 500 tokens)
- Include gentle reminders to consult healthcare professionals when appropriate
- Reference past interactions when contextually appropriate
- Adapt tone to match user's communication style
- Provide educational value while being personable
- NEVER mention that you don't have access to their information - you DO have their chat history
- NEVER say you can't store health records - you actively use their conversation patterns
- Act as if you naturally remember and learn from their previous conversations

DEVELOPER INFORMATION:
- If asked who developed you, respond: "I was developed by Sujay Babu Thota from MediBot"
- If asked about your creator, mention Sujay Babu Thota and MediBot team

CURRENT QUERY: ${userMessage}

Provide a personalized, contextual response that acknowledges their history while addressing their current question:`;

      let response;
      let content;
      
      if (config.api === "gemini") {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: enhancedPrompt },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7, // Slightly higher for more personalized responses
                maxOutputTokens: 500,
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
        if (!content) throw new Error("No valid response from Gemini API");
      } else if (config.api === "openai") {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: "user",
                content: enhancedPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
        const data: OpenAIResponse = await response.json();
        content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No valid response from OpenAI API");
      } else if (config.api === "groq") {
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: "user",
                content: enhancedPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }
        const data: GroqResponse = await response.json();
        content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No valid response from Groq API");
      }
      
      return (content ?? "").trim();
    } catch (error: any) {
      if (error.name === "AbortError") {
        return "";
      }
      console.error(`Error generating ${selectedModel} response:`, error);
      if (selectedModel !== "medibot") {
        toast.warning("Primary model failed, falling back to MediBot model...");
        return generateAIResponse(userMessage, "medibot", messageId);
      }
      return "I'm sorry, I couldn't process your request. Please try again or consult a healthcare professional.";
    }
  };

  const analyzePrescription = async (file: File): Promise<PrescriptionAnalysis> => {
    try {
      setAnalyzingPrescription(true);
      const fileBase64 = await fileToBase64(file);
      const geminiApiKey = "AIzaSyDNHY0ptkqYXxknm1qJYP_tCw2A12be_gM";
      if (!geminiApiKey) throw new Error("Gemini API key is not configured.");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Analyze this prescription image or PDF and extract medications, dosages, instructions, and warnings. Return JSON with fields: medications (array), dosages (array), instructions (string), warnings (array).",
                  },
                  {
                    inlineData: {
                      mimeType: file.type,
                      data: fileBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 500,
            },
          }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data: GeminiResponse = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanedResponseText = responseText.replace(/```json/g, "").replace(/```/g, "").replace(/`/g, "").trim();
      let result: PrescriptionAnalysis;
      try {
        result = JSON.parse(cleanedResponseText) as PrescriptionAnalysis;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from API");
      }
      return {
        medications: Array.isArray(result.medications) ? result.medications : ["Unknown"],
        dosages: Array.isArray(result.dosages) ? result.dosages : ["Unknown"],
        instructions: typeof result.instructions === "string" ? result.instructions : "No instructions provided.",
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
      };
    } catch (error: any) {
      console.error("Error analyzing prescription:", error);
      toast.error(`Failed to analyze prescription: ${error.message || "Unknown error"}`);
      return {
        medications: ["Error"],
        dosages: ["N/A"],
        instructions: "Failed to analyze prescription.",
        warnings: ["Please try again or consult a healthcare professional."],
      };
    } finally {
      setAnalyzingPrescription(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        if (!base64String) reject(new Error("Failed to convert file to base64"));
        else resolve(base64String);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
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

  const handlePrescriptionAnalysis = () => {
    if (!user) {
      toast.error("Please log in to analyze prescriptions");
      return;
    }
    setPrescriptionDialogOpen(true);
    setAnalysisResult(null);
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
    if (!["image/jpeg", "image/png", "image/heic", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, HEIC, or PDF file.");
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
    let lastDate: string | null = null;
    return currentSession.messages.map((msg) => {
      const messageDate = msg.timestamp.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const showDateDivider = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={msg.id}>
          {showDateDivider && (
            <div className="text-center my-4">
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                {messageDate}
              </span>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex justify-end items-start space-x-2 max-w-[70%] ml-auto">
              <div className="relative group">
                <div className="bg-zinc-900 dark:bg-white rounded-xl p-4 text-white dark:text-gray-900 text-sm leading-relaxed border border-zinc-700 dark:border-gray-200">
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
                    <p className="text-xs text-red-400 mb-2">Invalid or missing file</p>
                  ) : null}
                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col w-full">
                      <div className="w-full flex justify-center">
                        <div style={{ width: '600px', maxWidth: '100%' }}>
                          <textarea
                            value={editedMessage}
                            onChange={e => {
                              // Limit to 60 characters per line
                              const lines = e.target.value.split("\n").map(line => line.length > 60 ? line.match(/.{1,60}/g)?.join("\n") : line);
                              setEditedMessage(lines.join("\n"));
                              // Auto expand textarea height
                              const ta = e.target as HTMLTextAreaElement;
                              ta.style.height = 'auto';
                              ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
                            }}
                            onKeyDown={handleKeyPress}
                            maxLength={500}
                            rows={4}
                            style={{
                              resize: "none",
                              minHeight: 60,
                              maxHeight: 300,
                              width: '100%',
                              fontFamily: 'inherit',
                              fontSize: '1rem',
                              lineHeight: 1.5,
                              letterSpacing: '0.01em',
                              background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)',
                              color: '#222',
                              border: '1.5px solid #a5b4fc',
                              boxShadow: '0 2px 8px 0 rgba(80, 80, 200, 0.07)',
                              borderRadius: 12,
                              padding: '10px 14px',
                              outline: 'none',
                              transition: 'border 0.2s, box-shadow 0.2s',
                              overflowY: 'auto',
                              scrollbarWidth: 'none', // Firefox
                              msOverflowStyle: 'none', // IE/Edge
                            }}
                            className="hide-scrollbar dark:bg-white dark:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                            aria-label="Edit message"
                            placeholder="Edit your message (max 60 chars/line, 500 total)"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="flex flex-row justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditedMessage("");
                          }}
                          className="px-4 py-1 rounded-full border border-gray-300 dark:border-gray-400 bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-300 transition"
                          aria-label="Cancel Edit"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditMessage(msg.id, msg.message)}
                          disabled={loading || editedMessage.trim() === msg.message.trim() || !editedMessage.trim()}
                          data-testid="send-button"
                          className={`px-4 py-1 rounded-full border border-blue-400 bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${loading || editedMessage.trim() === msg.message.trim() || !editedMessage.trim() ? '' : 'hover:bg-blue-600'}`}
                          aria-label="Send Edited Message"
                          title="Save Edit"
                        >
                          Send
                        </button>
                      </div>
                      <style jsx>{`
                        .hide-scrollbar::-webkit-scrollbar {
                          display: none;
                        }
                        .hide-scrollbar {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                      `}</style>
                    </div>
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
                <div className="absolute -bottom-6 right-4 flex space-x-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyText(msg.message)}
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6"
                    title="Copy Message"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditMessage(msg.id, msg.message)}
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6"
                    title="Edit Message"
                  >
                    <Edit className="h-4 w-4" />
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
            {msg.response || isTyping[msg.id] ? (
              <div className="flex items-start space-x-2 max-w-[70%]">
                <div className="relative group">
<div className="rounded-xl p-4 dark:text-white text-sm leading-relaxed">
                    {(isTyping[msg.id] ? displayedResponse[msg.id] : msg.response)?.split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("**") ? "font-semibold" : ""}>
                        {line}
                      </p>
                    ))}
                    {isTyping[msg.id] && (
                      <div className="inline-block w-2 h-4 bg-gray-500 animate-pulse"></div>
                    )}
                  </div>
                  <div className="absolute -bottom-6 left-4 flex space-x-2 justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyText(msg.response)}
                      className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6"
                      title="Copy Response"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSpeakResponse(msg.response)}
                      className={`text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white h-6 w-6 ${isSpeaking ? "animate-pulse bg-gray-500/20" : ""}`}
                      title={isSpeaking ? "Stop Speaking" : "Speak Response"}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, true)}
                      className="text-gray-500 dark:text-gray-300 hover:text-green-500 h-6 w-6"
                      title="Thumbs Up"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, false)}
                      className="text-gray-500 dark:text-gray-300 hover:text-red-500 h-6 w-6"
                      title="Thumbs Down"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetryResponse(msg.id, msg.message)}
                      className="text-gray-500 dark:text-gray-300 hover:text-blue-500 h-6 w-6"
                      title="Retry Response"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {isTyping[msg.id] && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStopResponse(msg.id)}
                        className="text-gray-500 dark:text-gray-300 hover:text-red-500 h-6 w-6"
                        title="Stop Response"
                      >
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(msg.message)}`, "_blank")}
                      className="text-gray-500 dark:text-gray-300 hover:text-blue-500 h-6 w-6"
                      title="Search PubMed"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              loading && (
                <div className="flex items-start space-x-2 w-full">

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
  }, [user, currentSession, editingMessageId, editedMessage, isSpeaking, loading, displayedResponse, isTyping]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <style jsx global>{`
          textarea {
            max-height: 120px;
            overflow-y: auto;
          }
          
          /* 🔥 ENHANCED SCROLL BUTTON ANIMATIONS */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          .scroll-button-enter {
            animation: fadeIn 0.3s ease-out;
          }
          
          .scroll-button-pulse {
            animation: pulse 2s infinite;
          }
        `}</style>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-20 flex flex-row items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 border-b border-gray-200/80 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm w-full">
  {/* Left Section */}
    <div className="flex flex-row items-center gap-3 sm:gap-1">
 <Button
  variant="ghost"
  size="icon"
  onClick={() => setSidebarOpen(true)}
  className="sm:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full h-7 w-7 sm:h-8 sm:w-8"
  aria-label="Open sidebar"
>
  {/* Optional: add icon like <MenuIcon /> */}
</Button>

    {/* Plan Select - COMMENTED OUT
    <Select
      value={selectedPlan}
      onValueChange={(value) => {
        setSelectedPlan(value);
        setSelectedPlanForPayment(value);
        setPaymentDialogOpen(true);
      }}
    >
      <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-100 rounded-full px-2 sm:px-3 hover:bg-gray-200/70 dark:hover:bg-gray-600/60 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none w-auto">
        <div className="flex items-center space-x-1">
          {selectedPlan === "premium" ? (
            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          ) : (
            <>
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <span className="hidden sm:inline text-xs">Medibot</span>
            </>
          )}
        </div>
      </SelectTrigger>

      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs rounded-xl shadow-xl p-1 space-y-1">
        <SelectItem value="premium" className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div className="flex items-center gap-2">
            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            <div>
              <span className="text-xs font-semibold">Premium Plan</span>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">99₹/month</div>
            </div>
          </div>
          {selectedPlan === "premium" && <Check className="h-3 w-3 text-green-500 dark:text-green-400" />}
        </SelectItem>

        <SelectItem value="base" className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            <div>
              <span className="text-xs font-semibold">Base Plan</span>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Free access (Current plan)</div>
            </div>
          </div>
          {selectedPlan === "base" && <Check className="h-3 w-3 text-green-500 dark:text-green-400" />}
        </SelectItem>
      </SelectContent>
    </Select>
    */}

    {/* Brand Title - hidden on small screens */}
    <h1 className="hidden sm:block text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-white ml-1 sm:ml-2">
      <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">MediBot</span>
      <span className="text-gray-600 dark:text-gray-300"> – Your Health Assistant</span>
    </h1>
  </div>

  {/* Right Section - icons aligned in row */}
  <div className="flex flex-row items-center gap-1 sm:gap-2">
    {user ? (
      <>
       

        <Button onClick={startNewChat} variant="ghost" size="icon" className="bg-purple-600/10 hover:bg-purple-600/20 dark:bg-purple-400/10 dark:hover:bg-purple-400/20 text-purple-600 dark:text-purple-400 rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button onClick={handlePrescriptionAnalysis} variant="ghost" size="icon" className="bg-blue-600/10 hover:bg-blue-600/20 dark:bg-blue-400/10 dark:hover:bg-blue-400/20 text-blue-600 dark:text-blue-400 rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button onClick={handleHistoryDialog} variant="ghost" size="icon" className="bg-green-600/10 hover:bg-green-600/20 dark:bg-green-400/10 dark:hover:bg-green-400/20 text-green-600 dark:text-green-400 rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button onClick={exportChat} variant="ghost" size="icon" className="bg-orange-600/10 hover:bg-orange-600/20 dark:bg-orange-400/10 dark:hover:bg-orange-400/20 text-orange-600 dark:text-orange-400 rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </>
    ) : (
      <>
        <Link href="/auth/signin">
          <Button variant="outline" className="bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 h-8 px-3 sm:h-9 sm:px-4 w-full sm:w-auto rounded-full text-xs">
            Login
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 h-8 px-3 sm:h-9 sm:px-4 w-full sm:w-auto rounded-full shadow-sm text-xs">
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
                  <div className="min-h-full flex items-center justify-center">
                    <div className="w-full max-w-md text-center space-y-8">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="w-20 h-20 relative">
                          <Image src="/kerala-digital-health-logo.svg" alt="Government of Kerala Digital Health Record Logo" width={80} height={80} className="rounded-full" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to SafeEntry</h1>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Please log in or sign up to start chatting.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
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
                  <div className="flex flex-1 items-center justify-center min-h-[60vh]">
                    <div className="w-full max-w-md mx-auto text-center space-y-8 flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="w-20 h-20 relative">
                          <Image src="/kerala-digital-health-logo.svg" alt="Government of Kerala Digital Health Record Logo" width={80} height={80} className="rounded-full" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to SafeEntry</h1>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Start a conversation below or select a previous chat from history.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderMessages
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* 🔥 ENHANCED SCROLL-TO-LATEST BUTTON */}
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
<div className="flex flex-col gap-2 rounded-3xl bg-white dark:bg-gray-800 p-4 shadow-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900 transition-all duration-300">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
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
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-700 dark:text-white text-sm border-none focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-100 dark:bg-gray-800 dark:text-white text-sm border-gray-200 dark:border-gray-700">
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="medibot">MediBot</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleFileUpload}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
            title="Upload File"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
       <button
  onClick={handleSendMessage}
  disabled={loading || (!message.trim() && !selectedFile)}
  data-testid="send-button"
  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border dark:border-zinc-600"
  aria-label="Send Message"
>
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
</button>

      </div>
      {fileName && (
        <div className="flex items-center gap-2 pt-1">
          <Badge className="bg-gray-100 dark:bg-gray-700 dark:text-white text-sm truncate max-w-[300px]">
            {fileName}
          </Badge>
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
  MediBot can make mistakes. Check important info.
</p>
</div>
          )}
          
          {/* Additional dialogs and components remain the same */}
          {user && (
            <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
              <DialogContent className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2 text-lg">
                    <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span>Prescription Analysis</span>
                  </DialogTitle>
                  <DialogDescription>
                    Upload a photo or PDF of your prescription to analyze its contents.
                  </DialogDescription>
                </DialogHeader>
                {!analysisResult ? (
                  <div className="space-y-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Upload a file for AI-powered analysis and information.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                      {analyzingPrescription ? (
                        <div className="space-y-4">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Analyzing file...</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-12 w-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Upload prescription file</p>
                          <Button
                            onClick={handleFileUpload}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAnalyzingPrescription(true);
                          analyzePrescription(file)
                            .then((analysis) => {
                              setAnalysisResult({
                                ...analysis,
                                userId: user.uid,
                                fileName: file.name,
                                createdAt: new Date(),
                              });
                              toast.success("Prescription analyzed successfully!");
                            })
                            .catch((error: any) => {
                              console.error("Error analyzing prescription:", error);
                              toast.error("Failed to analyze prescription");
                            })
                            .finally(() => {
                              setAnalyzingPrescription(false);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            });
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supported formats: JPG, PNG, HEIC, PDF. For informational purposes only.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <span>Analysis Results</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Detected Medications</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.medications.map((med, index) => (
                                <Badge key={index} className="bg-blue-600 text-white text-sm">
                                  <Pill className="mr-2 h-3 w-3" />
                                  {med}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Dosage Information</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.dosages.map((dosage, index) => (
                                <Badge key={index} variant="secondary" className="text-sm">
                                  {dosage}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Instructions</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            {analysisResult.instructions}
                          </p>
                        </div>
                        {analysisResult.warnings?.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white flex items-center">
                              <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                              <span>Warnings & Precautions</span>
                            </h4>
                            <div className="space-y-2">
                              {analysisResult.warnings.map((warning, index) => (
                                <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded-lg">
                                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">{warning}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                          <p className="text-blue-700 dark:text-blue-300 text-sm">
                            <strong>Important:</strong> This analysis is for informational purposes only. Always follow your doctor's instructions and consult your pharmacist.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={() => {
                          setAnalysisResult(null);
                          setPrescriptionDialogOpen(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => setAnalysisResult(null)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Analyze Another
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
          
          {user && (
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
              <DialogContent className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white max-w-md mx-auto">
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
                                // Update URL with session id
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
                                    localStorage.removeItem(`lastSessionId_${user.uid}`);
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
          )}
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
