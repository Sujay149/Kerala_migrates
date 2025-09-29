"use client";

import {
  Eye,
  Star,
  Pill,
  Stethoscope,
  Download,
  MessageCircle,
  Clock,
  Calendar,
  Heart,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Shield,
  Activity,
  QrCode,
  FileText,
  Upload,
  UserCheck,
  BookOpen,
  Siren,
  Settings,
  History,
  Users,
  CreditCard,
  Phone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { OptimizedPage } from "@/components/OptimizedNavigation";
import { getCollectionOptimized } from "@/lib/firestore-optimized";

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect remembered or authenticated users to migrant profile page
  useEffect(() => {
    try {
      const remembered = typeof window !== 'undefined' && localStorage.getItem('medibot_remember') === 'true'
      if (!loading && (user || remembered)) {
        router.push('/migrant-profile')
      }
    } catch (err) {
      // ignore localStorage errors
    }
  }, [user, loading, router])

  // State for user count, download count, and loading
  const [userCount, setUserCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(92);
  const [tokensPerDay, setTokensPerDay] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'as' | 'bn' | 'brx' | 'doi' | 'gu' | 'hi' | 'kn' | 'ks' | 'gom' | 'mai' | 'ml' | 'mni' | 'mr' | 'ne' | 'or' | 'pa' | 'sa' | 'sat' | 'sd' | 'ta' | 'te' | 'ur'>('en');

  useEffect(() => {
    // Fetch user count and download count using optimized functions
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setDataError(null);

        const [users, downloads, feedback, chatSessions] = await Promise.allSettled([
          getCollectionOptimized("users", [], true, 600000),
          getCollectionOptimized("downloads", [], true, 300000),
          getCollectionOptimized("feedback", [], true, 600000),
          getCollectionOptimized("chat_sessions", [], true, 300000)
        ]);

        if (users.status === 'fulfilled') {
          setUserCount(users.value.length);
        }

        if (downloads.status === 'fulfilled') {
          setDownloadCount(downloads.value.length);
        }

        if (feedback.status === 'fulfilled') {
          const feedbackData = feedback.value;
          setTotalFeedback(feedbackData.length);
          if (feedbackData.length > 0) {
            const positiveFeedback = feedbackData.filter((f: any) => f.rating >= 4).length;
            const rate = Math.round((positiveFeedback / feedbackData.length) * 100);
            setSatisfactionRate(rate);
          }
        }

        if (chatSessions.status === 'fulfilled') {
          const sessionData = chatSessions.value;
          const today = new Date();
          const todaySessions = sessionData.filter((session: any) => {
            const sessionDate = new Date(session.timestamp || session.createdAt);
            return sessionDate.toDateString() === today.toDateString();
          });
          const estimatedTokens = todaySessions.reduce((total: number, session: any) => {
            return total + (session.messageCount || 1) * 50;
          }, 0);
          setTokensPerDay(estimatedTokens);
        }

        if (users.status === 'rejected' && downloads.status === 'rejected' && 
            feedback.status === 'rejected' && chatSessions.status === 'rejected') {
          setDataError("Unable to load data. Please check your connection.");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setDataError("An unexpected error occurred while loading data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async () => {
    try {
      setDownloadError(null);
      await addDoc(collection(db, "downloads"), {
        timestamp: new Date().toISOString(),
        userId: "anonymous",
      });
      setDownloadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error recording download:", error);
      setDownloadError("Failed to record download. Please try again.");
    }
  };

  const translations = {
    en: {
      appName: "SafeKerala",
      signIn: "Sign In",
      heroTitle: "Secure Digital Health Records for Kerala Migrants",
      heroDescription: "Your health companion that simplifies medication management, provides personalized insights, and ensures you never miss a dose.",
      getStarted: "Get Started Free",
      featuresTitle: "Take Control of Your Health",
      featuresDescription: "SafeKerala combines technology with intuitive design for health management in Kerala's digital health initiative.",
      smartMedicationTitle: "Smart Medication Tracking",
      smartMedicationDesc: "Log and track medications. Set schedules, view history, get insights.",
      aiHealthChatTitle: "AI-Powered Health Chat",
      aiHealthChatDesc: "Ask about health or prescriptions. Get personalized advice.",
      timelyRemindersTitle: "Timely Reminders",
      timelyRemindersDesc: "Customized reminders via email, WhatsApp, or notifications.",
      medicalSummarizerTitle: "Medical Information Summarizer",
      medicalSummarizerDesc: "Visualize schedules in an interactive calendar.",
      prescriptionAnalysisTitle: "Prescription Analysis",
      prescriptionAnalysisDesc: "Tailored health tips based on data.",
      securePrivateTitle: "Secure & Private",
      securePrivateDesc: "Data protected with encryption.",
      telemedicineTitle: "Telemedicine & Consultations",
      telemedicineDesc: "Connect with professionals remotely.",
      healthManagementTitle: "Health Management On The Go",
      healthManagementDesc: `Access your schedules, insights, and assistant from anywhere. Join ${isLoading ? "many" : `${downloadCount.toLocaleString()}+`} users!`,
      realTimeTracking: "Real-time tracking",
      instantNotifications: "Instant notifications",
      offlineAccess: "Offline access",
      biometricAuth: "Biometric authentication",
      downloadApp: "Download Mobile App",
      personalCompanionTitle: "Your Personal Health Companion",
      personalCompanionDesc: "AI assistant provides personalized recommendations.",
      twentyFourSeven: "24/7 answers",
      personalizedAdvice: "Personalized advice",
      interactionWarnings: "Interaction warnings",
      dosageOptimization: "Dosage optimization",
      tryAiAssistant: "Try AI Assistant",
      usersCount: "Users Count",
      satisfactionRate: "Satisfaction Rate",
      tokensPerDay: "Tokens per day",
      supportAvailable: "Support Available",
      totalDownloads: "Total Downloads",
      loadingStats: "Loading statistics...",
      ctaTitle: "Ready to Transform Your Healthcare?",
      ctaDescription: `Join ${isLoading ? "many" : `${userCount.toLocaleString()}+`} patients and professionals who trust SafeKerala.`,
      product: "Product",
      features: "Features",
      aiChatbot: "AI Chatbot",
      medicationReminders: "Medication Reminders",
      medicalSummarizer: "Medical Summarizer",
      prescriptionAnalysis: "Prescription Analysis",
      legal: "Legal",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      refundPolicy: "Refund Policy",
      developers: "Developers",
      copyright: `© ${new Date().getFullYear()} SafeKerala by Kerala Government. All rights reserved.`
    },
    ml: {
      appName: "സേഫ്കേരള",
      signIn: "സൈൻ ഇൻ",
      heroTitle: "കേരള പ്രവാസികൾക്കായി സുരക്ഷിത ഡിജിറ്റൽ ആരോഗ്യ രേഖകൾ",
      heroDescription: "മരുന്ന് മാനേജ്മെന്റ് ലളിതമാക്കുന്ന, വ്യക്തിഗതമാക്കിയ ഇൻസൈറ്റുകൾ നൽകുന്ന, ഒരു ഡോസും മിസ്സാകാതിരിക്കാൻ ഉറപ്പാക്കുന്ന നിങ്ങളുടെ ആരോഗ്യ സഹായി.",
      getStarted: "സൗജന്യമായി ആരംഭിക്കുക",
      featuresTitle: "നിങ്ങളുടെ ആരോഗ്യത്തിന്റെ നിയന്ത്രണം ഏറ്റെടുക്കുക",
      featuresDescription: "സേഫ്കേരള കേരളത്തിന്റെ ഡിജിറ്റൽ ആരോഗ്യ സംരംഭത്തിലെ ആരോഗ്യ മാനേജ്മെന്റിനായി സാങ്കേതികവിദ്യയെ ഇന്റ്യൂട്ടിവ് ഡിസൈനുമായി സംയോജിപ്പിക്കുന്നു.",
      smartMedicationTitle: "സ്മാർട്ട് മെഡിക്കേഷൻ ട്രാക്കിംഗ്",
      smartMedicationDesc: "മരുന്നുകൾ ലോഗ് ചെയ്യുകയും ട്രാക്ക് ചെയ്യുകയും ചെയ്യുക. ഷെഡ്യൂളുകൾ സജ്ജീകരിക്കുക, ചരിത്രം കാണുക, ഇൻസൈറ്റുകൾ നേടുക.",
      aiHealthChatTitle: "AI-പവർഡ് ഹെൽത്ത് ചാറ്റ്",
      aiHealthChatDesc: "ആരോഗ്യമോ പ്രിസ്ക്രിപ്ഷനുകളോ ചോദിക്കുക. വ്യക്തിഗതമാക്കിയ ഉപദേശം നേടുക.",
      timelyRemindersTitle: "കൃത്യസമയത്ത് ഓർമ്മപ്പെടുത്തലുകൾ",
      timelyRemindersDesc: "ഇമെയിൽ, വാട്ട്സാപ്പ്, അല്ലെങ്കിൽ അറിയിപ്പുകൾ വഴി ഇഷ്ടാനുസൃതമാക്കിയ ഓർമ്മപ്പെടുത്തലുകൾ.",
      medicalSummarizerTitle: "മെഡിക്കൽ ഇൻഫർമേഷൻ സമ്മറൈസർ",
      medicalSummarizerDesc: "ഇന്ററാക്ടീവ് കലണ്ടറിൽ ഷെഡ്യൂളുകൾ ദൃശ്യവത്കരിക്കുക.",
      prescriptionAnalysisTitle: "പ്രിസ്ക്രിപ്ഷൻ അനാലിസിസ്",
      prescriptionAnalysisDesc: "ഡാറ്റയെ അടിസ്ഥാനമാക്കിയുള്ള ഇഷ്ടാനുസൃത ആരോഗ്യ ടിപ്പുകൾ.",
      securePrivateTitle: "സുരക്ഷിതവും സ്വകാര്യവും",
      securePrivateDesc: "എൻക്രിപ്ഷനോടുകൂടിയ ഡാറ്റ സംരക്ഷണം.",
      telemedicineTitle: "ടെലിമെഡിസിൻ & കൺസൾട്ടേഷനുകൾ",
      telemedicineDesc: "പ്രൊഫഷണലുകളുമായി റിമോട്ടായി ബന്ധപ്പെടുക.",
      healthManagementTitle: "ആരോഗ്യ മാനേജ്മെന്റ് ഓൺ ദ ഗോ",
      healthManagementDesc: `എവിടെ നിന്നും നിങ്ങളുടെ ഷെഡ്യൂളുകൾ, ഇൻസൈറ്റുകൾ, അസിസ്റ്റന്റ് ആക്സസ് ചെയ്യുക. ${isLoading ? "പലരും" : `${downloadCount.toLocaleString()}+`} ഉപയോക്താക്കളോടൊപ്പം ചേരുക!`,
      realTimeTracking: "റിയൽ-ടൈം ട്രാക്കിംഗ്",
      instantNotifications: "തൽക്ഷണ അറിയിപ്പുകൾ",
      offlineAccess: "ഓഫ്ലൈൻ ആക്സസ്",
      biometricAuth: "ബയോമെട്രിക് പ്രാമാണീകരണം",
      downloadApp: "മൊബൈൽ ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക",
      personalCompanionTitle: "നിങ്ങളുടെ വ്യക്തിഗത ആരോഗ്യ സഹായി",
      personalCompanionDesc: "AI അസിസ്റ്റന്റ് വ്യക്തിഗതമാക്കിയ ശുപാർശകൾ നൽകുന്നു.",
      twentyFourSeven: "24/7 ഉത്തരങ്ങൾ",
      personalizedAdvice: "വ്യക്തിഗതമാക്കിയ ഉപദേശം",
      interactionWarnings: "ഇന്ററാക്ഷൻ മുന്നറിയിപ്പുകൾ",
      dosageOptimization: "ഡോസേജ് ഒപ്റ്റിമൈസേഷൻ",
      tryAiAssistant: "AI അസിസ്റ്റന്റ് പരീക്ഷിക്കുക",
      usersCount: "ഉപയോക്താക്കളുടെ എണ്ണം",
      satisfactionRate: "തൃപ്തി നിരക്ക്",
      tokensPerDay: "ദിവസത്തിലെ ടോക്കണുകൾ",
      supportAvailable: "പിന്തുണ ലഭ്യമാണ്",
      totalDownloads: "മൊത്തം ഡൗൺലോഡുകൾ",
      loadingStats: "സ്ഥിതിവിവരക്കണക്കുകൾ ലോഡ് ചെയ്യുന്നു...",
      ctaTitle: "നിങ്ങളുടെ ആരോഗ്യസംരക്ഷണം പരിവർത്തനപ്പെടുത്താൻ തയ്യാറാണോ?",
      ctaDescription: `${isLoading ? "പലരും" : `${userCount.toLocaleString()}+`} രോഗികളും പ്രൊഫഷണലുകളും സേഫ്കേരളയെ വിശ്വസിക്കുന്നവരോടൊപ്പം ചേരുക.`,
      product: "ഉൽപ്പന്നം",
      features: "വിശേഷതകൾ",
      aiChatbot: "AI ചാറ്റ്ബോട്ട്",
      medicationReminders: "മെഡിക്കേഷൻ ഓർമ്മപ്പെടുത്തലുകൾ",
      medicalSummarizer: "മെഡിക്കൽ സമ്മറൈസർ",
      prescriptionAnalysis: "പ്രിസ്ക്രിപ്ഷൻ അനാലിസിസ്",
      legal: "നിയമപരമായ",
      privacyPolicy: "സ്വകാര്യതാ നയം",
      termsOfService: "സേവന നിബന്ധനകൾ",
      refundPolicy: "റീഫണ്ട് നയം",
      developers: "ഡെവലപ്പർമാർ",
      copyright: `© ${new Date().getFullYear()} കേരള ഗവൺമെന്റിന്റെ സേഫ്കേരള. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.`
    },
    as: {}, // Assamese translations can be added here
    bn: {}, // Bengali
    brx: {}, // Bodo
    doi: {}, // Dogri
    gu: {}, // Gujarati
    hi: {}, // Hindi
    kn: {}, // Kannada
    ks: {}, // Kashmiri
    gom: {}, // Konkani
    mai: {}, // Maithili
    mni: {}, // Manipuri
    mr: {}, // Marathi
    ne: {}, // Nepali
    or: {}, // Odia
    pa: {}, // Punjabi
    sa: {}, // Sanskrit
    sat: {}, // Santali
    sd: {}, // Sindhi
    ta: {}, // Tamil
    te: {}, // Telugu
    ur: {} // Urdu
  };

  const t = (key: string) => {
    // Only return if key exists in translations[language] or translations['en']
    if (translations[language] && key in translations[language]) {
      return translations[language][key as keyof typeof translations[typeof language]];
    }
    if (translations['en'] && key in translations['en']) {
      return translations['en'][key as keyof typeof translations['en']];
    }
    return key;
  };

  const languages = [
    {code: 'en', name: 'English'},
    {code: 'as', name: 'অসমীয়া'},
    {code: 'bn', name: 'বাংলা'},
    {code: 'brx', name: 'बड़ो'},
    {code: 'doi', name: 'डोगरी'},
    {code: 'gu', name: 'ગુજરાતી'},
    {code: 'hi', name: 'हिन्दी'},
    {code: 'kn', name: 'ಕನ್ನಡ'},
    {code: 'ks', name: 'कॉशुर'},
    {code: 'gom', name: 'कोंकणी'},
    {code: 'mai', name: 'मैथिली'},
    {code: 'ml', name: 'മലയാളം'},
    {code: 'mni', name: 'ꯃꯤꯇꯩ ꯂꯣꯟ'},
    {code: 'mr', name: 'मराठी'},
    {code: 'ne', name: 'नेपाली'},
    {code: 'or', name: 'ଓଡ଼ିଆ'},
    {code: 'pa', name: 'ਪੰਜਾਬੀ'},
    {code: 'sa', name: 'संस्कृतम्'},
    {code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ'},
    {code: 'sd', name: 'سنڌي'},
    {code: 'ta', name: 'தமிழ்'},
    {code: 'te', name: 'తెలుగు'},
    {code: 'ur', name: 'اردو'},
  ];

  const fontClassMap: Record<string, string> = {
    ml: 'font-manjari',
    hi: 'font-noto-devanagari',
    bn: 'font-noto-bengali',
    gu: 'font-noto-gujarati',
    kn: 'font-noto-kannada',
    or: 'font-noto-oriya',
    pa: 'font-noto-gurmukhi',
    ta: 'font-noto-tamil',
    te: 'font-noto-telugu',
    ur: 'font-noto-nastaliq-urdu',
    // Add more as needed
  };
  const fontClass = fontClassMap[language] || '';

  const dir = ['ur', 'sd', 'ks'].includes(language) ? 'rtl' : 'ltr';

  return (
    <OptimizedPage 
      cacheKey="homepage"
      preloadRoutes={['/auth/signin', '/auth/signup', '/dashboard', '/chat', '/summarizer']}
    >
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Manjari:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Gujarati:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&family=Noto+Sans+Oriya:wght@400;700&family=Noto+Sans+Gurmukhi:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <div
        className={`min-h-screen bg-white text-gray-900 flex flex-col items-center justify-start overflow-x-hidden ${fontClass}`}
        suppressHydrationWarning={true}
        lang={language}
        dir={dir}
      >
      {/* Header Section */}
      <header
        className="fixed top-0 left-0 w-full bg-white z-50 border-b border-gray-300"
        role="banner"
      >
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between" role="navigation" aria-label="Main navigation">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 relative">
              <Image
                src="/kerala-digital-health-logo.svg"
                alt="Government of Kerala Digital Health Record Logo"
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            <h1 className="text-xl font-bold text-green-800">
              {t('appName')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="mr-4 p-2 border border-gray-300 rounded-md"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <Link href="/auth/signin" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50">
                {t('signIn')}
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main role="main" aria-label="Main content">
        <section 
          id="hero"
          className="relative py-12 md:pt-36 lg:pb-24"
          role="banner"
          aria-labelledby="hero-heading"
        >
        {/* Removed SVG background for minimalism */}

        <div className="relative max-w-7xl mt-20 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
              id="hero-heading"
            >
              {t('heroTitle')}
            </h1>
            <p
              className="mt-6 max-w-2xl mx-auto text-xl text-gray-600"
              aria-describedby="hero-heading"
            >
              {t('heroDescription')}
            </p>
            <div
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                asChild
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Link href="/auth/signup">{t('getStarted')}</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div
            className="mt-16 relative"
          >
            <div className="relative max-w-4xl mx-auto rounded-md overflow-hidden border border-gray-300">
              <Image
                src="/main.png"
                alt="SafeKerala App Dashboard - Kerala Digital Health Records"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Removed floating elements */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="w-full max-w-7xl mx-auto px-6 py-20 relative"
        id="features"
        aria-labelledby="features-heading"
        role="region"
      >
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-4xl font-bold text-gray-900">
            {t('featuresTitle')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('featuresDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[
            {
              icon: <Pill className="h-6 w-6 text-green-600" />,
              titleKey: "smartMedicationTitle" as const,
              descriptionKey: "smartMedicationDesc" as const,
              image: "/healthtrack.png",
              link: "/medications"
            },
            {
              icon: <MessageCircle className="h-6 w-6 text-green-600" />,
              titleKey: "aiHealthChatTitle" as const,
              descriptionKey: "aiHealthChatDesc" as const,
              image: "/chat.png",
              link: "/chat"
            },
            {
              icon: <Clock className="h-6 w-6 text-green-600" />,
              titleKey: "timelyRemindersTitle" as const,
              descriptionKey: "timelyRemindersDesc" as const,
              image: "/medication.png",
              link: "/reminders"
            },
            {
              icon: <BookOpen className="h-6 w-6 text-green-600" />,
              titleKey: "medicalSummarizerTitle" as const,
              descriptionKey: "medicalSummarizerDesc" as const,
              image: "/summarize.webp",
              link: "/summarizer"
            },
            {
              icon: <Activity className="h-6 w-6 text-green-600" />,
              titleKey: "prescriptionAnalysisTitle" as const,
              descriptionKey: "prescriptionAnalysisDesc" as const,
              image: "/prescription.webp",
              link: "/health-insights"
            },
            {
              icon: <Shield className="h-6 w-6 text-green-600" />,
              titleKey: "securePrivateTitle" as const,
              descriptionKey: "securePrivateDesc" as const,
              image: "/secure.jpeg",
              link: "/privacy"
            },
            {
              icon: <Phone className="h-6 w-6 text-green-600" />,
              titleKey: "telemedicineTitle" as const,
              descriptionKey: "telemedicineDesc" as const,
              image: "/telemedicine-icon.svg",
              link: "/consultations"
            },
          ].map((feature, index) => (
            <div
              key={index}
            >
              <Link href={feature.link} className="block h-full">
                <Card
                  className="bg-white rounded-md border border-gray-300 hover:border-green-300 transition-all h-full overflow-hidden cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={t(feature.titleKey)}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-gray-900 text-xl font-semibold">
                      <div className="p-2 bg-green-100 rounded-md">{feature.icon}</div>
                      <span>{t(feature.titleKey)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-base">{t(feature.descriptionKey)}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Image + Text Section (Alternating) */}
      <section className="w-full py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* First Row - Image Left (Mobile View) */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div
              className="lg:w-1/2"
            >
              <div className="relative rounded-md overflow-hidden border border-gray-300">
                <Image
                  src="/mobileview.png"
                  alt="SafeKerala Mobile App"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div
              className="lg:w-1/2"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('healthManagementTitle')}
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                {t('healthManagementDesc')}
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "realTimeTracking",
                  "instantNotifications",
                  "offlineAccess",
                  "biometricAuth",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{t(item)}</span>
                  </li>
                ))}
              </ul>
              <div
                className="flex items-center gap-4"
              >
                <Button asChild className="bg-green-600 text-white hover:bg-green-700">
                  <a
                    href="/safekerala.apk"
                    download="safekerala.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                  >
                    {t('downloadApp')}
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Second Row - Image Right */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div
              className="lg:w-1/2"
            >
              <div className="relative rounded-md overflow-hidden border border-gray-300">
                <Image
                  src="/chatroom.png"
                  alt="SafeKerala AI Assistant"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div
              className="lg:w-1/2"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('personalCompanionTitle')}
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                {t('personalCompanionDesc')}
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "twentyFourSeven",
                  "personalizedAdvice",
                  "interactionWarnings",
                  "dosageOptimization",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{t(item)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/chat">
                <Button className="bg-green-600 text-white hover:bg-green-700">{t('tryAiAssistant')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="w-full py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <p>{t('loadingStats')}</p>
          ) : dataError ? (
            <p>{dataError}</p>
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center"
            >
              {[
                {
                  number: userCount.toLocaleString(),
                  label: "usersCount",
                  icon: <Eye className="h-6 w-6 text-green-600" />,
                },
                {
                  number: `${satisfactionRate}%`,
                  label: "satisfactionRate",
                  icon: <Star className="h-6 w-6 text-green-600" />,
                },
                {
                  number: `${tokensPerDay}+`,
                  label: "tokensPerDay",
                  icon: <Pill className="h-6 w-6 text-green-600" />,
                },
                {
                  number: "24/7",
                  label: "supportAvailable",
                  icon: <Stethoscope className="h-6 w-6 text-green-600" />,
                },
                {
                  number: downloadCount.toLocaleString(),
                  label: "totalDownloads",
                  icon: <Download className="h-6 w-6 text-green-600" />,
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-6 rounded-md bg-gray-50 border border-gray-300"
                >
                  <div className="flex justify-center mb-3">{stat.icon}</div>
                  <div className="text-4xl font-bold text-green-800 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-lg">{t(stat.label)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="w-full py-32 bg-gray-50 relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('ctaTitle')}
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/auth/signup">
              <Button
                className="w-60 h-14 text-lg bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
              >
                {t('getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer 
        className="w-full bg-white py-12 border-t border-gray-300"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 relative">
                <Image
                  src="/kerala-digital-health-logo.svg"
                  alt="Government of Kerala Digital Health Record Logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-green-800">{t('appName')}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('product')}</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#features"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('features')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('features')}</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/chat"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('aiChatbot')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/medications"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('medicationReminders')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/summarizer"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('medicalSummarizer')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chat"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('prescriptionAnalysis')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('legal')}</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('privacyPolicy')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('termsOfService')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refund"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                     {t('refundPolicy')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/creators"
                      className="text-gray-600 hover:text-green-800 transition-colors"
                    >
                      {t('developers')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-300 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              {t('copyright')}
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-600 hover:text-green-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-green-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-green-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </OptimizedPage>
  );
}