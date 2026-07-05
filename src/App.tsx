import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, 
  Laptop, 
  Truck, 
  Wrench, 
  Scissors, 
  GraduationCap, 
  Sprout, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  X, 
  Send, 
  TrendingUp, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Filter,
  DollarSign,
  Users,
  Sliders,
  RefreshCw,
  User,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  Trash2
} from "lucide-react";

import { Gig, ApplicationFormData, Category, UserProfile } from "./types";
import { CATEGORIES, LOCATIONS, INITIAL_GIGS } from "./data";
import GoogleSheetsSync from "./components/GoogleSheetsSync";
import ProfileDrawer from "./components/ProfileDrawer";

// Helper to convert categories to Lucide Icons
const getCategoryIcon = (iconName: string, size = 18) => {
  switch (iconName) {
    case "Laptop": return <Laptop size={size} />;
    case "Truck": return <Truck size={size} />;
    case "Wrench": return <Wrench size={size} />;
    case "Scissors": return <Scissors size={size} />;
    case "GraduationCap": return <GraduationCap size={size} />;
    case "Sprout": return <Sprout size={size} />;
    case "Sliders": return <Sliders size={size} />;
    case "Briefcase":
    default:
      return <Briefcase size={size} />;
  }
};

// Clean WhatsApp numbers to international standard 233XXXXXXXXX
const cleanWhatsAppNumber = (num: string): string => {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "233" + digits.substring(1);
  }
  if (digits.length === 9 && !digits.startsWith("233")) {
    return "233" + digits;
  }
  return digits.startsWith("233") ? digits : "233" + digits;
};

// Beautiful Hustle Tips for Ghanaian Freelancers
const HUSTLE_TIPS = [
  "Verify details with your client over WhatsApp before traveling.",
  "Set up a professional WhatsApp Business profile to look official.",
  "Never pay money upfront to secure a gig or project.",
  "Clearly list your delivery timeline so clients review it first.",
  "Ghanaian gold is in tech and delivery! Keep up-to-date with trends.",
  "Ask happy customers to refer you to their friends in Osu or East Legon!"
];

export default function App() {
  // Gigs state loaded from localStorage or initialized with seed data
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "saved" | "sync" | "my-gigs">("browse");
  const [savedGigIds, setSavedGigIds] = useState<string[]>([]);

  // Auth states
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("hustlehub_auth_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [authPhone, setAuthPhone] = useState<string | null>(() => {
    try {
      return localStorage.getItem("hustlehub_auth_phone") || null;
    } catch (e) {
      return null;
    }
  });

  // Track Google token and Sheet ID for backend requests
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState<string | null>(null);

  // Login form states
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "code">("phone");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [receivedMockCode, setReceivedMockCode] = useState<string | null>(null);

  const handleImportGigs = (imported: Gig[], merge: boolean) => {
    if (merge) {
      const existingIds = new Set(gigs.map(g => g.id));
      const newGigs = imported.filter(g => !existingIds.has(g.id));
      const updated = [...newGigs, ...gigs];
      saveGigs(updated);
    } else {
      saveGigs(imported);
    }
  };
  
  // Local profile states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // App Theme & Background States
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem("hustlehub_theme");
      return (saved as 'light' | 'dark') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [bgType, setBgType] = useState<string>(() => {
    try {
      return localStorage.getItem("hustlehub_bg_type") || "none";
    } catch (e) {
      return "none";
    }
  });

  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    try {
      return localStorage.getItem("hustlehub_bg_custom_url") || "";
    } catch (e) {
      return "";
    }
  });

  // Apply root theme class dynamically
  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    try {
      localStorage.setItem("hustlehub_theme", t);
    } catch (e) {}
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  };

  const handleSetBgType = (type: string) => {
    setBgType(type);
    try {
      localStorage.setItem("hustlehub_bg_type", type);
    } catch (e) {}
  };

  const handleSetCustomBgUrl = (url: string) => {
    setCustomBgUrl(url);
    try {
      localStorage.setItem("hustlehub_bg_custom_url", url);
    } catch (e) {}
  };

  const getBackgroundStyle = () => {
    switch (bgType) {
      case "sunset":
        return {
          background: theme === "light"
            ? "linear-gradient(135deg, #fef08a 0%, #f97316 50%, #ccfbf1 100%)"
            : "linear-gradient(135deg, #022c22 0%, #115e59 40%, #7c2d12 100%)",
          backgroundAttachment: "fixed"
        } as React.CSSProperties;
      case "cyber":
        return {
          background: theme === "light"
            ? "radial-gradient(at 0% 0%, #ccfbf1 0px, transparent 50%), radial-gradient(at 100% 100%, #fef08a 0px, transparent 50%)"
            : "radial-gradient(at 0% 0%, #004d40 0px, transparent 50%), radial-gradient(at 50% 0%, #001e18 0px, transparent 70%), radial-gradient(at 100% 0%, #78350f 0px, transparent 50%)",
          backgroundAttachment: "fixed"
        } as React.CSSProperties;
      case "ocean":
        return {
          background: theme === "light"
            ? "linear-gradient(135deg, #e0f2f1 0%, #cbd5e1 50%, #bae6fd 100%)"
            : "linear-gradient(135deg, #011612 0%, #004d40 60%, #0c4a6e 100%)",
          backgroundAttachment: "fixed"
        } as React.CSSProperties;
      case "abstract":
        return {
          backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        } as React.CSSProperties;
      case "custom":
        if (customBgUrl.trim()) {
          return {
            backgroundImage: `url('${customBgUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed"
          } as React.CSSProperties;
        }
        return {} as React.CSSProperties;
      default:
        return {} as React.CSSProperties;
    }
  };

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    try {
      return localStorage.getItem("hustlehub_install_dismissed") !== "true";
    } catch (e) {
      return true;
    }
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check matchMedia standalone
    try {
      if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
        setIsInstalled(true);
      }
    } catch (e) {}

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstallFlow = async () => {
    if (!deferredPrompt) {
      alert("Browser installation prompt is not available yet. If you are on iOS/Safari, please tap the 'Share' icon and select 'Add to Home Screen'. If you are on Android/Chrome, select 'Install app' from the menu.");
      return;
    }
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        triggerToast("💚 Awesome! HustleHub installed successfully.");
      }
    } catch (err) {}
    setDeferredPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem("hustlehub_install_dismissed", "true");
    } catch (e) {}
  };

  // Sync theme to document element on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hustlehub_theme") || 'dark';
      const root = document.documentElement;
      if (saved === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    } catch (e) {}
  }, []);

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem("hustlehub_profile", JSON.stringify(updated));
    triggerToast("👤 Profile saved successfully! Form pre-fills are active.");
  };

  const handleClearProfile = () => {
    setProfile(null);
    localStorage.removeItem("hustlehub_profile");
    triggerToast("🗑️ Profile cleared successfully.");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      alert("Please enter a valid phone number.");
      return;
    }

    // Standardize to international format: clean digits and prepend +233
    const digits = loginPhone.replace(/\D/g, "");
    let cleaned = digits;
    if (digits.startsWith("0")) {
      cleaned = digits.substring(1);
    } else if (digits.startsWith("233")) {
      cleaned = digits.substring(3);
    }

    if (cleaned.length < 8) {
      alert("Please enter a valid Ghanaian phone number (e.g. 244123456 or 0244123456).");
      return;
    }

    const fullPhone = `+233${cleaned}`;
    setIsLoginLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone })
      });

      if (!response.ok) {
        throw new Error("Failed to send verification SMS");
      }

      const data = await response.json();
      setReceivedMockCode(data.code || "123456");
      setLoginStep("code");
      triggerToast("📱 SMS Code sent! Check the screen banner to auto-fill.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode || loginCode.length !== 6) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    const digits = loginPhone.replace(/\D/g, "");
    let cleaned = digits;
    if (digits.startsWith("0")) {
      cleaned = digits.substring(1);
    } else if (digits.startsWith("233")) {
      cleaned = digits.substring(3);
    }
    const fullPhone = `+233${cleaned}`;

    setIsLoginLoading(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: loginCode })
      });

      if (!response.ok) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      const data = await response.json();
      const token = data.token;
      const phoneNum = data.phone;

      localStorage.setItem("hustlehub_auth_token", token);
      localStorage.setItem("hustlehub_auth_phone", phoneNum);
      setAuthToken(token);
      setAuthPhone(phoneNum);

      // Pre-fill user profile automatically if none exists, or update the phone number in the profile
      const savedProfile = localStorage.getItem("hustlehub_profile");
      let activeProf = null;
      if (savedProfile) {
        try {
          activeProf = JSON.parse(savedProfile);
        } catch (e) {}
      }

      const updatedProf = {
        name: activeProf?.name || "Ghanaian Freelancer",
        phone: phoneNum,
        location: activeProf?.location || "East Legon, Accra",
        customLocation: activeProf?.customLocation || ""
      };

      setProfile(updatedProf);
      localStorage.setItem("hustlehub_profile", JSON.stringify(updatedProf));

      triggerToast("💚 Verification successful! Welcome to HustleHub.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to verify SMS code.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out from HustleHub? Your authentication session will be cleared.")) {
      setIsProfileDrawerOpen(false);
      localStorage.removeItem("hustlehub_auth_token");
      localStorage.removeItem("hustlehub_auth_phone");
      setAuthToken(null);
      setAuthPhone(null);
      triggerToast("🔒 Logged out successfully.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "🚨 DANGER ZONE: Are you sure you want to PERMANENTLY delete your HustleHub account?\n\nThis will permanently delete your phone number, remove all your posted gigs from Google Sheets, and scrub all local browser data. This cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsProfileDrawerOpen(false);
      setIsLoginLoading(true);

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${authToken}`
      };
      if (googleToken) headers["x-google-token"] = googleToken;
      if (googleSpreadsheetId) headers["x-spreadsheet-id"] = googleSpreadsheetId;

      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers
      });

      if (!response.ok) {
        throw new Error("Failed to delete account from server database");
      }

      // Remove local gigs matching user phone
      const cleanPhoneTarget = (authPhone || "").replace(/\D/g, "");
      const remainingGigs = gigs.filter(gig => {
        const gigPhone = (gig.userPhone || "").replace(/\D/g, "");
        return gigPhone !== cleanPhoneTarget;
      });
      saveGigs(remainingGigs);

      // Scrub all browser cache/storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset react states
      setAuthToken(null);
      setAuthPhone(null);
      setProfile(null);
      setSavedGigIds([]);
      setLoginPhone("");
      setLoginCode("");
      setLoginStep("phone");
      setReceivedMockCode(null);

      triggerToast("🔥 Account and associated posts have been completely wiped!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete account. Please try again.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleDeleteGig = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this hustle? This action will permanently remove it from the Google Sheet and your feed.");
    if (!confirmed) return;

    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${authToken}`
      };
      if (googleToken) headers["x-google-token"] = googleToken;
      if (googleSpreadsheetId) headers["x-spreadsheet-id"] = googleSpreadsheetId;

      const response = await fetch(`/api/delete-gig/${id}`, {
        method: "DELETE",
        headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete gig from server");
      }

      // Filter locally too
      const updated = gigs.filter(g => g.id !== id);
      saveGigs(updated);
      triggerToast("🗑️ Hustle deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete hustle. Please verify you own it.");
    }
  };

  const openPostModal = () => {
    if (profile) {
      const locExists = LOCATIONS.some(loc => loc.name === profile.location);
      setNewGig({
        title: "",
        category: "tech",
        customCategory: "",
        description: "",
        budget: "",
        whatsapp: profile.phone || "",
        location: locExists ? profile.location : "Other / Custom",
        customLocation: locExists ? "" : profile.location,
        posterName: profile.name || "",
        duration: "One-time",
        requirements: "",
        expiresIn: "never"
      });
    } else {
      setNewGig({
        title: "",
        category: "tech",
        customCategory: "",
        description: "",
        budget: "",
        whatsapp: "",
        location: "East Legon, Accra",
        customLocation: "",
        posterName: "",
        duration: "One-time",
        requirements: "",
        expiresIn: "never"
      });
    }
    setIsPostModalOpen(true);
  };

  // Filtering & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customCategoryQuery, setCustomCategoryQuery] = useState("");
  const [customLocationQuery, setCustomLocationQuery] = useState("");
  
  // Modal states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedGigToApply, setSelectedGigToApply] = useState<Gig | null>(null);
  const [expandedGigId, setExpandedGigId] = useState<string | null>(null);

  // Form states
  const [newGig, setNewGig] = useState({
    title: "",
    category: "tech",
    customCategory: "",
    description: "",
    budget: "",
    whatsapp: "",
    location: "East Legon, Accra",
    customLocation: "",
    posterName: "",
    duration: "One-time",
    requirements: "",
    expiresIn: "never"
  });

  const [applyForm, setApplyForm] = useState<ApplicationFormData>({
    name: "",
    message: ""
  });

  // AI Autofill states
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [rawAiText, setRawAiText] = useState("");
  const [showSmartPaste, setShowSmartPaste] = useState(false);

  const handleAiAutofill = async () => {
    if (!rawAiText.trim()) {
      triggerToast("⚠️ Please type or paste some text first.");
      return;
    }

    setIsAiParsing(true);
    try {
      const response = await fetch("/api/parse-gig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: rawAiText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse gig description");
      }

      const parsed = await response.json();

      // Mapping categories safely
      let mappedCategory = "other";
      if (parsed.category === "Tech & Social Media") mappedCategory = "tech";
      else if (parsed.category === "Delivery & Transit") mappedCategory = "delivery";
      else if (parsed.category === "Handwork & Repair" || parsed.category === "Handywork & Repair") mappedCategory = "handywork";
      else if (parsed.category === "Fashion & Hair") mappedCategory = "fashion";
      else if (parsed.category === "Teaching & Writing") mappedCategory = "tutoring";
      else if (parsed.category === "Agric & Business" || parsed.category === "Agric & Garden") mappedCategory = "agriculture";

      // Payout cleaning (e.g. GH₵150 -> 150)
      let cleanedBudget = "";
      if (parsed.payout && parsed.payout !== "Negotiable") {
        const match = parsed.payout.match(/\d+/);
        if (match) {
          cleanedBudget = match[0];
        }
      }

      // Location cleaning
      let mappedLocation = "East Legon, Accra";
      let mappedCustomLocation = "";

      const lowerParsedLoc = (parsed.location || "").toLowerCase();
      const matchedLoc = LOCATIONS.find(loc => 
        loc.name.toLowerCase().includes(lowerParsedLoc) || 
        lowerParsedLoc.includes(loc.name.toLowerCase())
      );

      if (matchedLoc && matchedLoc.id !== "other") {
        mappedLocation = matchedLoc.name;
      } else {
        mappedLocation = "Other / Custom";
        mappedCustomLocation = parsed.location;
      }

      setNewGig(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        category: mappedCategory,
        budget: cleanedBudget,
        location: mappedLocation,
        customLocation: mappedCustomLocation,
        description: parsed.description || prev.description
      }));

      triggerToast("✨ Form successfully auto-filled by HustleHub AI!");
      setShowSmartPaste(false);
    } catch (err: any) {
      console.error(err);
      triggerToast(`❌ AI Parsing error: ${err.message || "Please try again."}`);
    } finally {
      setIsAiParsing(false);
    }
  };

  // Success Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Hustle tip index cycler
  const [tipIndex, setTipIndex] = useState(0);

  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Clean expired gigs helper
  const filterAndCleanExpiredGigs = (gigsList: Gig[]): Gig[] => {
    const now = Date.now();
    return gigsList.filter(gig => {
      // Exclude hardcoded legacy dummy/mock gigs with single-digit IDs
      if (/^gig-\d$/.test(gig.id)) return false;
      if (!gig.expiresAt) return true;
      const expiryTime = new Date(gig.expiresAt).getTime();
      return expiryTime > now;
    });
  };

  // Helper to determine remaining duration
  const getRemainingTime = (isoString?: string) => {
    if (!isoString) return null;
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d left`;
    if (hrs > 0) return `${hrs}h left`;
    return `${mins}m left`;
  };

  // Refresh feed trigger
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const saved = localStorage.getItem("hustlehub_gigs");
      let currentList = INITIAL_GIGS;
      if (saved) {
        try {
          currentList = JSON.parse(saved);
        } catch (e) {}
      }
      const activeGigs = filterAndCleanExpiredGigs(currentList);
      setGigs(activeGigs);
      localStorage.setItem("hustlehub_gigs", JSON.stringify(activeGigs));

      // Filter bookmarks too
      const savedFavorites = localStorage.getItem("hustlehub_saved");
      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites) as string[];
          const activeIds = new Set(activeGigs.map(g => g.id));
          const filteredFavs = parsed.filter(id => activeIds.has(id));
          setSavedGigIds(filteredFavs);
          localStorage.setItem("hustlehub_saved", JSON.stringify(filteredFavs));
        } catch (e) {}
      }

      setTipIndex(Math.floor(Math.random() * HUSTLE_TIPS.length));
      setIsRefreshing(false);
      setPullDistance(0);
      triggerToast("🔄 Feed refreshed & expired hustles cleaned up!");
    }, 1000);
  };

  // Touch handlers for Pull down to Refresh
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        const distance = Math.min(diff * 0.4, 90);
        setPullDistance(distance);
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      setIsPulling(false);
      if (pullDistance >= 60 && !isRefreshing) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, isPulling, pullDistance, isRefreshing]);

  // Initialize and load gigs
  useEffect(() => {
    const saved = localStorage.getItem("hustlehub_gigs");
    let initialList = INITIAL_GIGS;
    if (saved) {
      try {
        initialList = JSON.parse(saved);
      } catch (e) {
        initialList = INITIAL_GIGS;
      }
    }
    const activeGigs = filterAndCleanExpiredGigs(initialList);
    setGigs(activeGigs);
    localStorage.setItem("hustlehub_gigs", JSON.stringify(activeGigs));

    const savedFavorites = localStorage.getItem("hustlehub_saved");
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites) as string[];
        const activeIds = new Set(activeGigs.map(g => g.id));
        const filteredFavs = parsed.filter(id => activeIds.has(id));
        setSavedGigIds(filteredFavs);
        localStorage.setItem("hustlehub_saved", JSON.stringify(filteredFavs));
      } catch (e) {}
    }

    const savedProfile = localStorage.getItem("hustlehub_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }
  }, []);

  // Save gigs to local storage on changes
  const saveGigs = (updatedGigs: Gig[]) => {
    setGigs(updatedGigs);
    localStorage.setItem("hustlehub_gigs", JSON.stringify(updatedGigs));
  };

  // Cycle tips automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HUSTLE_TIPS.length);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Set transient toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Bookmark a gig
  const toggleSaveGig = (id: string) => {
    let updated;
    if (savedGigIds.includes(id)) {
      updated = savedGigIds.filter(gId => gId !== id);
      triggerToast("Gig removed from your bookmarks");
    } else {
      updated = [...savedGigIds, id];
      triggerToast("Gig bookmarked successfully!");
    }
    setSavedGigIds(updated);
    localStorage.setItem("hustlehub_saved", JSON.stringify(updated));
  };

  // Handler for posting a new gig
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGig.title || !newGig.description || !newGig.budget || !newGig.whatsapp || !newGig.posterName) {
      alert("Please fill in all required fields.");
      return;
    }

    if (newGig.category === "other" && !newGig.customCategory.trim()) {
      alert("Please specify your custom category.");
      return;
    }

    if (newGig.location === "Other / Custom" && !newGig.customLocation.trim()) {
      alert("Please specify your custom location.");
      return;
    }

    const cleanedNumber = cleanWhatsAppNumber(newGig.whatsapp);
    if (cleanedNumber.length < 10) {
      alert("Please enter a valid Ghanaian WhatsApp number.");
      return;
    }

    const reqArray = newGig.requirements
      ? newGig.requirements.split(",").map(r => r.trim()).filter(r => r !== "")
      : [];

    let expiresAt: string | undefined = undefined;
    if (newGig.expiresIn && newGig.expiresIn !== "never") {
      const now = Date.now();
      let durationMs = 0;
      switch (newGig.expiresIn) {
        case "1h": durationMs = 1 * 60 * 60 * 1000; break;
        case "6h": durationMs = 6 * 60 * 60 * 1000; break;
        case "12h": durationMs = 12 * 60 * 60 * 1000; break;
        case "24h": durationMs = 24 * 60 * 60 * 1000; break;
        case "3d": durationMs = 3 * 24 * 60 * 60 * 1000; break;
        case "7d": durationMs = 7 * 24 * 60 * 60 * 1000; break;
      }
      if (durationMs > 0) {
        expiresAt = new Date(now + durationMs).toISOString();
      }
    }

    const newlyCreated: Gig = {
      id: "gig-" + Date.now(),
      title: newGig.title,
      description: newGig.description,
      budget: parseFloat(newGig.budget) || 0,
      category: newGig.category,
      customCategory: newGig.category === "other" ? newGig.customCategory.trim() : undefined,
      whatsapp: cleanedNumber,
      location: newGig.location === "Other / Custom" ? newGig.customLocation.trim() : newGig.location,
      createdAt: new Date().toISOString(),
      posterName: newGig.posterName,
      duration: newGig.duration || "One-time",
      requirements: reqArray,
      expiresAt,
      userPhone: authPhone || undefined
    };

    // Post to backend Google Sheets API
    const postToBackend = async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        };
        if (googleToken) headers["x-google-token"] = googleToken;
        if (googleSpreadsheetId) headers["x-spreadsheet-id"] = googleSpreadsheetId;

        const res = await fetch("/api/gigs", {
          method: "POST",
          headers,
          body: JSON.stringify(newlyCreated)
        });

        if (res.ok) {
          const data = await res.json();
          const savedGig = data.gig;
          const updatedGigs = [savedGig, ...gigs];
          saveGigs(updatedGigs);
          triggerToast("🎉 Your Hustle has been posted and synced to Google Sheets!");
        } else {
          const updatedGigs = [newlyCreated, ...gigs];
          saveGigs(updatedGigs);
          triggerToast("🎉 Posted locally. Google Sheets sync is pending.");
        }
      } catch (err) {
        console.error(err);
        const updatedGigs = [newlyCreated, ...gigs];
        saveGigs(updatedGigs);
        triggerToast("🎉 Posted locally (offline-first mode).");
      }
    };

    postToBackend();

    // Reset Form with profile pre-fill if present
    if (profile) {
      const locExists = LOCATIONS.some(loc => loc.name === profile.location);
      setNewGig({
        title: "",
        category: "tech",
        customCategory: "",
        description: "",
        budget: "",
        whatsapp: profile.phone || "",
        location: locExists ? profile.location : "Other / Custom",
        customLocation: locExists ? "" : profile.location,
        posterName: profile.name || "",
        duration: "One-time",
        requirements: "",
        expiresIn: "never"
      });
    } else {
      setNewGig({
        title: "",
        category: "tech",
        customCategory: "",
        description: "",
        budget: "",
        whatsapp: "",
        location: "East Legon, Accra",
        customLocation: "",
        posterName: "",
        duration: "One-time",
        requirements: "",
        expiresIn: "never"
      });
    }

    setIsPostModalOpen(false);
  };

  // Initiate Application Modal
  const openApplyModal = (gig: Gig) => {
    setSelectedGigToApply(gig);
    setApplyForm({ 
      name: profile?.name || "", 
      message: `Hi ${gig.posterName}, I'm interested in your Hustle: "${gig.title}". I am ready to get to work!` 
    });
    setIsApplyModalOpen(true);
  };

  // Form Application & Whatsapp URL redirect
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGigToApply) return;

    if (!applyForm.name || !applyForm.message) {
      alert("Please fill out your name and a brief message.");
      return;
    }

    const formattedNum = selectedGigToApply.whatsapp;
    
    // Construct pre-filled message
    const lineBreak = "%0A";
    const textStr = `Hello *${selectedGigToApply.posterName}*, I saw your Hustle: "*${selectedGigToApply.title}*" on *HustleHub*! I would love to apply for it.${lineBreak}${lineBreak}*My Name:* ${applyForm.name}${lineBreak}*My Message/Proposal:* ${applyForm.message}${lineBreak}${lineBreak}_Sent via HustleHub Ghana_ 🇬🇭`;
    
    const whatsappUrl = `https://wa.me/${formattedNum}?text=${textStr}`;

    setIsApplyModalOpen(false);
    triggerToast("🚀 Connecting you to WhatsApp chat...");

    // Open WhatsApp link in new tab
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 800);
  };

  // Filter computations
  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.posterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gig.customCategory || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "other") {
      if (gig.category === "other") {
        if (customCategoryQuery.trim()) {
          matchesCategory = (gig.customCategory || "").toLowerCase().includes(customCategoryQuery.toLowerCase());
        } else {
          matchesCategory = true;
        }
      } else {
        matchesCategory = false;
      }
    } else {
      matchesCategory = gig.category === selectedCategory;
    }

    let matchesLocation = false;
    if (!selectedLocation) {
      matchesLocation = true;
    } else if (selectedLocation === "Other / Custom") {
      const isStandardLocation = LOCATIONS.filter(l => l.name !== "Other / Custom").some(l => l.name === gig.location);
      if (!isStandardLocation || gig.location === "Other / Custom") {
        if (customLocationQuery.trim()) {
          matchesLocation = gig.location.toLowerCase().includes(customLocationQuery.toLowerCase());
        } else {
          matchesLocation = true;
        }
      } else {
        matchesLocation = false;
      }
    } else {
      matchesLocation = gig.location === selectedLocation;
    }
    
    if (activeTab === "saved") {
      return matchesSearch && matchesCategory && matchesLocation && savedGigIds.includes(gig.id);
    }
    if (activeTab === "my-gigs") {
      const authDigits = authPhone ? authPhone.replace(/\D/g, "") : "";
      if (!authDigits) return false;
      const gigPhoneDigits = gig.userPhone ? gig.userPhone.replace(/\D/g, "") : (gig.whatsapp ? gig.whatsapp.replace(/\D/g, "") : "");
      const isOwned = gigPhoneDigits.length > 5 && (gigPhoneDigits.endsWith(authDigits) || authDigits.endsWith(gigPhoneDigits));
      return isOwned && matchesSearch && matchesCategory && matchesLocation;
    }
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const totalBudgetPool = filteredGigs.reduce((acc, curr) => acc + curr.budget, 0);

  // Format relative time helper
  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 60) return `${mins <= 0 ? 1 : mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  if (!authToken) {
    return (
      <div 
        className="min-h-screen bg-dark-bg flex items-center justify-center p-4 selection:bg-accent-teal selection:text-white"
        style={getBackgroundStyle()}
      >
        <div className="w-full max-w-md bg-dark-surface border border-teal-800/60 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-teal/5 blur-2xl animate-pulse" />
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-accent-teal flex items-center justify-center shadow-lg text-white font-extrabold text-3xl mx-auto">
              H
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-4">
              Hustle<span className="text-accent-teal">Hub</span> Ghana
            </h1>
            <p className="text-xs text-teal-200/70 font-semibold uppercase tracking-wider">
              Connecting Ghana's Freelancers 🇬🇭
            </p>
          </div>

          {loginStep === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider">
                  Enter Your Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="bg-dark-bg border border-teal-900 rounded-xl px-3 py-2.5 text-xs text-teal-300 font-bold flex items-center gap-1.5">
                    <span>🇬🇭</span>
                    <span>+233</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 244123456 or 0553987654"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="flex-1 bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-teal-700/80 focus:outline-none transition-all font-bold"
                  />
                </div>
                <span className="text-[10px] text-teal-300/40 leading-relaxed block">
                  Enter your Ghana phone number. We support formats starting with 0 or the rest of the digits.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full bg-accent-teal hover:bg-teal-600 text-white py-3 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoginLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Verification SMS</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider">
                  Enter 6-Digit SMS Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-center text-sm tracking-widest text-white placeholder-teal-700 focus:outline-none transition-all font-black font-mono animate-fadeIn"
                />
                
                {receivedMockCode && (
                  <div className="bg-teal-950/20 p-3 rounded-xl border border-teal-900/60 text-center animate-fadeIn">
                    <p className="text-[10px] text-teal-200/90 font-medium">
                      📱 Mock SMS sent! Enter code: <strong className="text-ghana-gold font-mono font-black text-xs">{receivedMockCode}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setLoginCode(receivedMockCode)}
                      className="text-[9px] text-accent-teal hover:underline font-extrabold uppercase mt-1 tracking-wider"
                    >
                      Click to Auto-fill Code
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep("phone");
                    setReceivedMockCode(null);
                  }}
                  className="w-1/3 bg-dark-bg hover:bg-teal-950/40 border border-teal-900/60 text-teal-300 py-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="flex-1 bg-accent-teal hover:bg-teal-600 text-white py-3 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoginLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2 border-t border-teal-900/30">
            <p className="text-[9px] text-teal-300/40">
              By continuing, you agree to secure SMS verification. Code is mocked server-side. Secure fallback: "123456" always works.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-dark-bg flex flex-col antialiased text-white selection:bg-accent-teal selection:text-white transition-all duration-300"
      style={getBackgroundStyle()}
    >
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-dark-card border-l-4 border-accent-teal text-white p-4 rounded-xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🇬🇭</span>
              <p className="text-sm font-semibold text-teal-50">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-teal-200 hover:text-white ml-2">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pull to Refresh Visual Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-75"
          style={{ 
            top: `${75 + (isRefreshing ? 15 : pullDistance * 0.5)}px`,
            opacity: isRefreshing ? 1 : Math.min(pullDistance / 50, 1)
          }}
        >
          <div className="bg-dark-surface border border-teal-800/80 px-4 py-2 rounded-full shadow-2xl flex items-center space-x-2.5 text-white">
            <RefreshCw 
              className={`text-accent-teal ${isRefreshing ? "animate-spin" : ""}`} 
              size={14} 
              style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)` }}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-100">
              {isRefreshing ? "Refreshing..." : pullDistance >= 60 ? "Release to Refresh" : "Pull to Refresh"}
            </span>
          </div>
        </div>
      )}

      {/* Top Professional Header Navigation */}
      <header className="sticky top-0 z-40 bg-dark-surface text-white shadow-xl border-b border-teal-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Visual Logo */}
            <div className="w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center shadow-lg text-white font-extrabold text-xl tracking-tighter">
              H
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Hustle<span className="text-accent-teal">Hub</span>
                </h1>
                <span className="text-[10px] bg-dark-bg text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-900/60">PWA</span>
              </div>
              <p className="text-[10px] text-teal-200 opacity-70 tracking-wide font-semibold uppercase">Connecting Ghana's Freelancers 🇬🇭</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="bg-dark-bg hover:bg-teal-950 border border-teal-900/60 text-teal-300 hover:text-white p-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <button 
              onClick={() => setIsProfileDrawerOpen(true)}
              className="bg-dark-bg hover:bg-teal-950 border border-teal-900/60 text-teal-300 hover:text-white px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Set up your profile for auto-fills"
            >
              <User size={15} />
              <span className="hidden sm:inline">{profile ? "My Profile" : "Set Profile"}</span>
            </button>
            <button 
              onClick={openPostModal}
              className="bg-accent-teal hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Post a Hustle</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 space-y-4">

        {/* PWA INSTALL BANNER */}
        {showInstallBanner && !isInstalled && (
          <div className="bg-gradient-to-r from-teal-950 via-dark-surface to-teal-900 border border-teal-800/60 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden bento-card">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-ghana-gold/5 blur-2xl animate-pulse" />
            <div className="flex items-start space-x-3.5 z-10">
              <div className="p-3 bg-ghana-gold/15 border border-ghana-gold/30 rounded-2xl text-ghana-gold text-2xl flex-shrink-0">
                🇬🇭
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                  Install HustleHub Ghana
                  <span className="text-[9px] bg-ghana-gold/20 text-ghana-gold px-2 py-0.5 rounded-full border border-ghana-gold/40 uppercase font-mono font-bold tracking-wide">
                    Fast Clean App
                  </span>
                </h3>
                <p className="text-xs text-teal-200 opacity-80 mt-1 leading-relaxed max-w-xl">
                  Add HustleHub to your Home Screen for a clean, full-screen native experience. Zero loading delay, fast offline access, and no address bar clutter!
                </p>
                
                {/* How-To Install expandable Details */}
                <details className="mt-2 text-[10px] text-teal-300 hover:text-white cursor-pointer focus:outline-none transition-colors">
                  <summary className="font-bold">
                    💡 Click here to view install instructions for your device
                  </summary>
                  <div className="mt-1.5 p-3 bg-dark-bg/60 rounded-xl border border-teal-900/40 space-y-2 text-teal-100 font-medium leading-relaxed">
                    <p>📱 <strong>Android / Chrome:</strong> Tap the browser menu (three dots in top right) and select <span className="text-ghana-gold font-bold">"Install App"</span> or <span className="text-ghana-gold font-bold">"Add to Home screen"</span>.</p>
                    <p>🍏 <strong>iOS / Safari (iPhone):</strong> Tap the <span className="text-ghana-gold font-bold">Share button</span> (square with arrow up), scroll down and tap <span className="text-ghana-gold font-bold">"Add to Home Screen"</span>.</p>
                    <p>💻 <strong>Desktop (Chrome/Edge):</strong> Click the tiny <span className="text-ghana-gold font-bold">monitor/install icon</span> in your browser's address bar.</p>
                  </div>
                </details>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto z-10">
              <button
                onClick={triggerInstallFlow}
                className="flex-1 md:flex-initial bg-ghana-gold hover:bg-yellow-500 text-dark-bg px-4.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>Install Now</span>
              </button>
              <button
                onClick={dismissInstallBanner}
                className="p-2.5 rounded-xl text-teal-300 hover:text-white hover:bg-teal-900/40 border border-teal-900/40 transition-all cursor-pointer flex items-center justify-center"
                title="Dismiss and hide this banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* BENTO GRID STATS BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Bento Card 1: Active Numbers */}
          <div className="bg-dark-surface text-white p-5 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden bento-card border border-teal-800/60">
            {/* Ambient Background Glow Pattern */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-accent-teal opacity-10 blur-2xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-200 opacity-60 tracking-wider uppercase">Live Gigs</span>
              <div className="p-1.5 rounded-lg bg-dark-bg/60 text-accent-teal">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white font-mono">{filteredGigs.length}</span>
              <span className="text-xs text-teal-200 opacity-70 block mt-1">Available in Ghana today</span>
            </div>
          </div>

          {/* Bento Card 2: Total Budget Pool */}
          <div className="bg-dark-card p-5 rounded-3xl shadow-xl flex flex-col justify-between border border-teal-800/40 bento-card relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-200 opacity-60 tracking-wider uppercase">Hustle Volume</span>
              <span className="text-[10px] font-bold bg-accent-teal/20 text-teal-200 px-2 py-0.5 rounded-full border border-accent-teal/30">GHS (GH₵)</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-ghana-gold font-mono">
                GH₵{totalBudgetPool.toLocaleString()}
              </span>
              <span className="text-xs text-teal-200 opacity-70 block mt-1">Total payout potential</span>
            </div>
          </div>

          {/* Bento Card 3: Dynamic Tips & Tricks */}
          <div className="bg-dark-surface border border-teal-800/60 p-5 rounded-3xl shadow-xl flex flex-col justify-between bento-card col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 text-accent-teal">
              <Lightbulb size={18} className="text-ghana-gold flex-shrink-0 animate-bounce" />
              <span className="text-xs font-bold tracking-wider uppercase text-teal-200 opacity-75">Freelancer Tip</span>
            </div>
            <p className="text-xs text-teal-100 opacity-80 font-medium leading-relaxed mt-2 italic">
              "{HUSTLE_TIPS[tipIndex]}"
            </p>
            <div className="flex space-x-1 mt-3">
              {HUSTLE_TIPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTipIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === tipIndex ? "w-4 bg-accent-teal" : "w-1.5 bg-teal-800"}`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* BENTO SEARCH & NAVIGATION CONTROLS */}
        <div className="bg-dark-surface rounded-3xl shadow-xl border border-teal-800/50 p-5 space-y-4">
          
          {/* Quick Tabs to browse / saved / sync */}
          <div className="flex items-center justify-between border-b border-teal-900/40 pb-3">
            <div className="flex space-x-1 bg-dark-bg p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("browse")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "browse" 
                    ? "bg-accent-teal text-white shadow-md" 
                    : "text-teal-200 hover:text-white"
                }`}
              >
                Browse Hustles
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                  activeTab === "saved" 
                    ? "bg-accent-teal text-white shadow-md" 
                    : "text-teal-200 hover:text-white"
                }`}
              >
                Bookmarks
                {savedGigIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-ghana-gold text-dark-bg text-[9px] font-black flex items-center justify-center">
                    {savedGigIds.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("my-gigs")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "my-gigs" 
                    ? "bg-accent-teal text-white shadow-md" 
                    : "text-teal-200 hover:text-white"
                }`}
              >
                My Gigs
              </button>
              <button
                onClick={() => setActiveTab("sync")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "sync" 
                    ? "bg-accent-teal text-white shadow-md" 
                    : "text-teal-200 hover:text-white"
                }`}
              >
                Sheets Sync
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-dark-bg hover:bg-teal-950 text-teal-300 hover:text-white border border-teal-900/60 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                title="Refresh feed and auto-clean expired hustles"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-accent-teal" : ""}`} />
                <span className="hidden sm:inline">Refresh Feed</span>
              </button>
              <span className="text-xs text-teal-200/40 font-semibold font-mono hidden md:inline">
                Locally stored in Ghana
              </span>
            </div>
          </div>

          {/* Quick Filters - Search, Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-300">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search gigs, skills, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium focus:outline-none focus:bg-dark-bg transition-all text-white placeholder-teal-600/80"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Location Select */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-300">
                <MapPin size={16} />
              </span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:bg-dark-bg transition-all text-teal-100 appearance-none cursor-pointer"
              >
                <option value="" className="bg-dark-surface text-white">All Regions in Ghana</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.name} className="bg-dark-surface text-white">
                    {loc.name} ({loc.region})
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-teal-400">
                <ChevronDown size={14} />
              </span>
            </div>

          </div>

          {/* Custom input search fields when Other/Custom option is active */}
          <AnimatePresence>
            {(selectedLocation === "Other / Custom" || selectedCategory === "other") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1.5 overflow-hidden"
              >
                {selectedCategory === "other" ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type custom job criteria / category... (e.g. MC, Cook)"
                      value={customCategoryQuery}
                      onChange={(e) => setCustomCategoryQuery(e.target.value)}
                      className="w-full bg-dark-bg border border-teal-500/50 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none transition-all text-white placeholder-teal-600/80 shadow-md"
                    />
                    {customCategoryQuery && (
                      <button 
                        onClick={() => setCustomCategoryQuery("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-teal-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : <div className="hidden md:block"></div>}

                {selectedLocation === "Other / Custom" ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type custom location / suburb... (e.g. Spintex, Madina)"
                      value={customLocationQuery}
                      onChange={(e) => setCustomLocationQuery(e.target.value)}
                      className="w-full bg-dark-bg border border-teal-500/50 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none transition-all text-white placeholder-teal-600/80 shadow-md"
                    />
                    {customLocationQuery && (
                      <button 
                        onClick={() => setCustomLocationQuery("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-teal-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : <div className="hidden md:block"></div>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Horizontal category chips scrolling */}
          <div className="pt-2">
            <span className="text-[10px] font-black tracking-wider text-teal-200/50 uppercase block mb-2">
              Filter by Category
            </span>
            <div className="flex overflow-x-auto pb-2 space-x-2 -mx-4 px-4 scrollbar-none scroll-smooth">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent-teal text-white border-accent-teal shadow-md"
                        : "bg-dark-bg text-teal-200 border-teal-900 hover:border-accent-teal hover:bg-dark-card"
                    }`}
                  >
                    <span>{getCategoryIcon(cat.icon, 14)}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* FEED / LIST OF GIGS */}
        {activeTab === "sync" ? (
          <GoogleSheetsSync
            currentGigs={gigs}
            onImportGigs={handleImportGigs}
            triggerToast={triggerToast}
          />
        ) : (
          <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-teal-100/90 uppercase tracking-wider">
              {activeTab === "saved" ? "Your Bookmarked Hustles" : "Featured Hustles"} ({filteredGigs.length})
            </h2>
            
            {(selectedCategory !== "all" || selectedLocation || searchTerm || customCategoryQuery || customLocationQuery) && (
              <button 
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLocation("");
                  setSearchTerm("");
                  setCustomCategoryQuery("");
                  setCustomLocationQuery("");
                }}
                className="text-xs font-bold text-teal-300 hover:text-white flex items-center space-x-1"
              >
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {filteredGigs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-surface border border-teal-900/50 rounded-3xl p-8 text-center shadow-xl"
            >
              <div className="w-14 h-14 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3 text-accent-teal border border-teal-800/40">
                <Briefcase size={26} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {gigs.length === 0 ? "No Active Hustles" : "No Hustles Found"}
              </h3>
              <p className="text-xs text-teal-200 opacity-70 max-w-sm mx-auto mb-4">
                {activeTab === "saved" 
                  ? "You haven't bookmarked any gigs yet. Add some to quickly access them later."
                  : gigs.length === 0
                    ? "No active hustles available right now. Be the first to post one"
                    : "We couldn't find any gigs matching your criteria. Try loosening up your filters or post a new hustle!"
                }
              </p>
              {activeTab !== "saved" ? (
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="bg-accent-teal hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Post the First Gig</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("browse")}
                  className="text-accent-teal font-bold hover:underline text-xs"
                >
                  Browse all gigs
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div layout="position" className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredGigs.map((gig, index) => {
                  const isExpanded = expandedGigId === gig.id;
                  const categoryInfo = CATEGORIES.find(c => c.id === gig.category);
                  const isSaved = savedGigIds.includes(gig.id);

                  return (
                    <motion.div
                      layout
                      key={gig.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        layout: { type: "spring", stiffness: 280, damping: 28 },
                        opacity: { duration: 0.15 },
                        y: { duration: 0.15 }
                      }}
                      className={`bg-dark-surface border rounded-3xl p-5 transition-all shadow-xl ${
                        isExpanded ? "border-accent-teal ring-2 ring-accent-teal/10" : "border-teal-900/60 hover:border-teal-800"
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Category Badge */}
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-accent-teal/20 text-teal-300 border border-accent-teal/30 uppercase tracking-wider">
                              {gig.category === "other" && gig.customCategory ? gig.customCategory : (categoryInfo?.name || gig.category)}
                            </span>
                            {/* Duration Indicator */}
                            {gig.duration && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dark-bg text-teal-300 border border-teal-900/40">
                                {gig.duration}
                              </span>
                            )}
                            {/* Expiry Badge */}
                            {gig.expiresAt && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-950/40 text-rose-300 border border-rose-900/40 flex items-center space-x-1 font-mono">
                                <span>⏳</span>
                                <span>{getRemainingTime(gig.expiresAt)}</span>
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-sm md:text-base font-extrabold text-white leading-snug hover:text-teal-200 transition-colors">
                            {gig.title}
                          </h3>
                        </div>

                        {/* Budget display */}
                        <div className="bg-dark-card text-ghana-gold border border-teal-800/40 px-3 py-1.5 rounded-2xl text-right flex-shrink-0 shadow-sm">
                          <span className="text-[9px] font-bold text-teal-300/60 block uppercase tracking-wider">Payout</span>
                          <span className="text-sm md:text-base font-black font-mono">GH₵{gig.budget}</span>
                        </div>
                      </div>

                      {/* Snippet / Expanded Content */}
                      <p className={`text-xs text-teal-100/85 leading-relaxed font-medium ${isExpanded ? "" : "line-clamp-2"}`}>
                        {gig.description}
                      </p>

                      {/* Extended Details (if expanded) */}
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3.5 pt-3.5 border-t border-teal-900/50 space-y-3"
                        >
                          {/* Requirements */}
                          {gig.requirements && gig.requirements.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase text-teal-300/60 tracking-wider mb-1.5">
                                Hustle Requirements
                              </h4>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {gig.requirements.map((req, rIdx) => (
                                  <li key={rIdx} className="flex items-center space-x-1.5 text-xs text-teal-100 font-medium">
                                    <CheckCircle2 size={13} className="text-accent-teal flex-shrink-0" />
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Info Panel Grid */}
                          <div className="grid grid-cols-2 gap-2 bg-dark-bg/60 p-3 rounded-2xl border border-teal-950">
                            <div>
                              <span className="text-[9px] text-teal-300/40 font-extrabold uppercase block">Posted By</span>
                              <span className="text-xs font-bold text-white flex items-center space-x-1">
                                <Building2 size={11} className="text-teal-500" />
                                <span>{gig.posterName}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-teal-300/40 font-extrabold uppercase block">WhatsApp Verified</span>
                              <span className="text-xs font-bold text-white flex items-center space-x-1 font-mono">
                                <Phone size={10} className="text-teal-500" />
                                <span>+{gig.whatsapp}</span>
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Bottom Control Actions */}
                      <div className="mt-3 pt-3 border-t border-teal-900/50 flex items-center justify-between">
                        
                        <div className="flex items-center space-x-3 text-teal-200/80">
                          {/* Location */}
                          <span className="flex items-center space-x-1 text-xs font-bold">
                            <MapPin size={13} className="text-teal-400" />
                            <span>{gig.location}</span>
                          </span>

                          {/* Time */}
                          <span className="flex items-center space-x-1 text-xs font-medium font-mono">
                            <Calendar size={13} className="text-teal-500" />
                            <span>{getRelativeTime(gig.createdAt)}</span>
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {/* Delete button (exclusively for owner in my-gigs) */}
                          {activeTab === "my-gigs" && (
                            <button
                              onClick={() => handleDeleteGig(gig.id)}
                              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                              title="Permanently delete this hustle"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}

                          {/* Bookmark button */}
                          <button
                            onClick={() => toggleSaveGig(gig.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isSaved 
                                ? "bg-ghana-gold border-ghana-gold text-dark-bg" 
                                : "border-teal-900 text-teal-300 hover:text-white hover:bg-dark-card"
                            }`}
                            title="Bookmark this Hustle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                          </button>

                          {/* Read More Accordion */}
                          <button
                            onClick={() => setExpandedGigId(isExpanded ? null : gig.id)}
                            className="px-3 py-2 rounded-xl text-xs font-bold border border-teal-900 hover:bg-dark-card text-teal-200 flex items-center space-x-1 cursor-pointer"
                          >
                            <span>{isExpanded ? "Less" : "Details"}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {/* Instant apply button */}
                          <button
                            onClick={() => openApplyModal(gig)}
                            className="bg-accent-teal hover:bg-teal-600 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <span>Apply</span>
                            <Send size={12} className="text-ghana-gold" />
                          </button>
                        </div>

                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-dark-surface text-white mt-12 border-t border-teal-900/60">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center space-y-2">
          <p className="text-xs text-teal-200/80 font-medium">
            HustleHub Ghana 🇬🇭 • Built locally for perfect offline/PWA gig access.
          </p>
          <p className="text-[10px] text-teal-500/80 font-mono">
            All data saved instantly to your current device browser session. No cloud tracking.
          </p>
        </div>
      </footer>

      {/* MOBILE-FIRST FLOATING BUTTON */}
      <div className="fixed bottom-4 right-4 z-30 md:hidden">
        <button
          onClick={openPostModal}
          className="bg-ghana-gold text-dark-bg p-4 rounded-full shadow-2xl flex items-center justify-center font-bold active:scale-90 transition-all cursor-pointer pulse-glow animate-pulse"
          style={{ boxShadow: "0 10px 25px -5px rgba(0, 137, 123, 0.4)" }}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* MODAL 1: POST A GIG */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-dark-bg/80 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-dark-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] border border-teal-800/60"
            >
              {/* Header */}
              <div className="bg-dark-card border-b border-teal-900/40 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Post a New Hustle</h3>
                  <p className="text-xs text-teal-300">Find the perfect helper in Ghana today</p>
                </div>
                <button 
                  onClick={() => setIsPostModalOpen(false)}
                  className="text-teal-300 hover:text-white bg-dark-bg/60 p-2 rounded-xl border border-teal-900/40 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Scroll Container */}
              <form onSubmit={handlePostSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* AI SMART PASTE CONTAINER */}
                <div className="bg-gradient-to-r from-teal-950/40 via-dark-surface to-teal-900/40 border border-teal-800/40 p-4 rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">✨</span>
                      <h4 className="text-xs font-black text-white">AI Quick-Post / Smart Paste</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSmartPaste(!showSmartPaste)}
                      className="text-[10px] font-extrabold text-accent-teal hover:text-teal-400 bg-teal-950/80 border border-teal-800/40 px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                    >
                      {showSmartPaste ? "Hide" : "Show AI Tool"}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showSmartPaste && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2.5 overflow-hidden"
                      >
                        <p className="text-[10px] text-teal-300 font-medium leading-relaxed">
                          💡 Type or paste a description of what you need (e.g. <em>"Need a delivery rider to send yams from Madina to East Legon, paying GH₵150. Urgent!"</em>) and let HustleHub's AI engine automatically fill out the form fields below!
                        </p>
                        <textarea
                          rows={3}
                          placeholder="Paste or write your raw, messy details here..."
                          value={rawAiText}
                          onChange={(e) => setRawAiText(e.target.value)}
                          className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2 text-xs focus:outline-none transition-all text-white placeholder-teal-800 font-medium"
                        />
                        <button
                          type="button"
                          disabled={isAiParsing}
                          onClick={handleAiAutofill}
                          className="w-full bg-accent-teal hover:bg-teal-600 disabled:bg-teal-950 disabled:text-teal-700 disabled:border-teal-900/40 border border-teal-800/20 text-white py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                        >
                          {isAiParsing ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Processing with Gemini AI...</span>
                            </>
                          ) : (
                            <>
                              <span>✨ Auto-Fill Form fields</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Poster Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Your Name / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auntie Mansa Catering or Bright Ackon"
                    value={newGig.posterName}
                    onChange={(e) => setNewGig({ ...newGig, posterName: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Hustle / Gig Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent Delivery Rider or Custom Bridal Braider"
                    value={newGig.title}
                    onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                  />
                </div>

                {/* Category & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newGig.category}
                      onChange={(e) => setNewGig({ ...newGig, category: e.target.value })}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-teal-100 font-bold cursor-pointer"
                    >
                      {CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id} className="bg-dark-surface text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Day, 3 Days, Weekly"
                      value={newGig.duration}
                      onChange={(e) => setNewGig({ ...newGig, duration: e.target.value })}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                    />
                  </div>
                </div>

                {/* Conditional Custom Category Input */}
                <AnimatePresence>
                  {newGig.category === "other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                        Specify Custom Category / Job Criteria <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Professional Photographer, Event MC, Caterer"
                        value={newGig.customCategory}
                        onChange={(e) => setNewGig({ ...newGig, customCategory: e.target.value })}
                        className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Location & Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                      Location / Region <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newGig.location}
                      onChange={(e) => setNewGig({ ...newGig, location: e.target.value })}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-teal-100 font-bold cursor-pointer"
                    >
                      {LOCATIONS.map(loc => (
                        <option key={loc.id} value={loc.name} className="bg-dark-surface text-white">{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                      Budget (GHS GH₵) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 250"
                      value={newGig.budget}
                      onChange={(e) => setNewGig({ ...newGig, budget: e.target.value })}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold font-mono placeholder-teal-700/65"
                    />
                  </div>
                </div>

                {/* Conditional Custom Location Input */}
                <AnimatePresence>
                  {newGig.location === "Other / Custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                        Specify Custom Location / Suburb <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Madina, Spintex Road, Airport Residential Area"
                        value={newGig.customLocation}
                        onChange={(e) => setNewGig({ ...newGig, customLocation: e.target.value })}
                        className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* WhatsApp Number */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Your WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400 text-xs font-extrabold font-mono">
                      +233
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 24 412 3456 or 0244123456"
                      value={newGig.whatsapp}
                      onChange={(e) => setNewGig({ ...newGig, whatsapp: e.target.value })}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 pl-14 pr-3 text-xs focus:outline-none transition-all text-white font-semibold font-mono placeholder-teal-700/65"
                    />
                  </div>
                  <span className="text-[9px] text-teal-300/40 block mt-1.5">
                    Applicants will contact you directly on this number via WhatsApp.
                  </span>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Hustle Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Clearly describe the tasks, working hours, and expectations. This helps attract high-quality freelancers!"
                    value={newGig.description}
                    onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-medium placeholder-teal-700/65"
                  />
                </div>

                {/* Requirements / Bullets */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Key Requirements (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Valid Driver License, Honest, Hard-working"
                    value={newGig.requirements}
                    onChange={(e) => setNewGig({ ...newGig, requirements: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                  />
                  <span className="text-[9px] text-teal-300/40 block mt-1.5">
                    Separate each specific requirement with a comma (,).
                  </span>
                </div>

                {/* Expiry / Lifespan Option */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Hustle Expiry Time <span className="text-accent-teal">(Auto-clean on Refresh)</span>
                  </label>
                  <select
                    value={newGig.expiresIn}
                    onChange={(e) => setNewGig({ ...newGig, expiresIn: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-teal-100 font-bold cursor-pointer"
                  >
                    <option value="never" className="bg-dark-surface text-white">Never Expire / Always Available</option>
                    <option value="1h" className="bg-dark-surface text-white">1 Hour</option>
                    <option value="6h" className="bg-dark-surface text-white">6 Hours</option>
                    <option value="12h" className="bg-dark-surface text-white">12 Hours</option>
                    <option value="24h" className="bg-dark-surface text-white">24 Hours (1 Day)</option>
                    <option value="3d" className="bg-dark-surface text-white">3 Days</option>
                    <option value="7d" className="bg-dark-surface text-white">7 Days (1 Week)</option>
                  </select>
                  <span className="text-[9px] text-teal-300/40 block mt-1.5">
                    Select how long this gig remains active. After expiry, it will automatically vanish upon page refresh!
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-teal-900 hover:bg-dark-card text-teal-200 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-accent-teal hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1 transition-all shadow-md cursor-pointer"
                  >
                    <span>Post Hustle</span>
                    <span>🇬🇭</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: APPLY FOR A GIG */}
      <AnimatePresence>
        {isApplyModalOpen && selectedGigToApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute inset-0 bg-dark-bg/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-dark-surface rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 border border-teal-800/60"
            >
              {/* Header */}
              <div className="bg-dark-card border-b border-teal-900/40 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Apply for this Hustle</h3>
                  <p className="text-xs text-teal-300 truncate max-w-[280px]">
                    {selectedGigToApply.title}
                  </p>
                </div>
                <button 
                  onClick={() => setIsApplyModalOpen(false)}
                  className="text-teal-300 hover:text-white bg-dark-bg/60 p-2 rounded-xl border border-teal-900/40 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleApplySubmit} className="p-5 space-y-4">
                
                {/* Visual context card */}
                <div className="bg-dark-card p-4 rounded-2xl border border-teal-900/40 space-y-1.5 shadow-inner">
                  <div className="flex justify-between items-center text-[10px] font-bold text-accent-teal uppercase tracking-wider">
                    <span>{selectedGigToApply.posterName}</span>
                    <span className="font-mono text-ghana-gold bg-accent-teal/10 px-2 py-0.5 rounded border border-accent-teal/30">
                      GH₵{selectedGigToApply.budget}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{selectedGigToApply.title}</h4>
                  <p className="text-[11px] text-teal-200 opacity-70 line-clamp-1">{selectedGigToApply.description}</p>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={applyForm.name}
                    onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-semibold placeholder-teal-700/65"
                  />
                </div>

                {/* Pitch Message */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1.5">
                    Your Pitch Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain why you are qualified, how quickly you can do it, and leave your contact info!"
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-all text-white font-medium placeholder-teal-700/65"
                  />
                  <span className="text-[9px] text-teal-300/40 block mt-1.5">
                    This message will be sent pre-filled in a private chat on WhatsApp.
                  </span>
                </div>

                {/* WhatsApp Pre-Send Disclaimer / Preview */}
                <div className="bg-dark-bg/85 p-3.5 rounded-2xl border border-teal-950 flex items-start space-x-2.5">
                  <span className="text-lg flex-shrink-0">💬</span>
                  <div className="text-[10px] text-teal-200/70 font-medium leading-relaxed">
                    When you click <strong className="text-accent-teal">Submit Application</strong>, we will generate a link and launch WhatsApp to start your instant conversation with <strong className="text-teal-100">{selectedGigToApply.posterName}</strong>.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-teal-900 hover:bg-dark-card text-teal-200 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-accent-teal hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Submit & Open WhatsApp</span>
                    <Send size={12} className="text-ghana-gold" />
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        onSave={handleSaveProfile}
        onClear={handleClearProfile}
        currentProfile={profile}
        triggerToast={triggerToast}
        theme={theme}
        setTheme={setTheme}
        bgType={bgType}
        setBgType={handleSetBgType}
        customBgUrl={customBgUrl}
        setCustomBgUrl={handleSetCustomBgUrl}
        isAuthenticated={!!authToken}
        userPhone={authPhone || undefined}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

    </div>
  );
}
