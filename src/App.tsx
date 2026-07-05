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
  Sliders
} from "lucide-react";

import { Gig, ApplicationFormData, Category } from "./types";
import { CATEGORIES, LOCATIONS, INITIAL_GIGS } from "./data";
import GoogleSheetsSync from "./components/GoogleSheetsSync";

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
  const [activeTab, setActiveTab] = useState<"browse" | "saved" | "sync">("browse");
  const [savedGigIds, setSavedGigIds] = useState<string[]>([]);

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
    requirements: ""
  });

  const [applyForm, setApplyForm] = useState<ApplicationFormData>({
    name: "",
    message: ""
  });

  // Success Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Hustle tip index cycler
  const [tipIndex, setTipIndex] = useState(0);

  // Initialize and load gigs
  useEffect(() => {
    const saved = localStorage.getItem("hustlehub_gigs");
    if (saved) {
      try {
        setGigs(JSON.parse(saved));
      } catch (e) {
        setGigs(INITIAL_GIGS);
      }
    } else {
      setGigs(INITIAL_GIGS);
      localStorage.setItem("hustlehub_gigs", JSON.stringify(INITIAL_GIGS));
    }

    const savedFavorites = localStorage.getItem("hustlehub_saved");
    if (savedFavorites) {
      try {
        setSavedGigIds(JSON.parse(savedFavorites));
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
      requirements: reqArray
    };

    const updatedGigs = [newlyCreated, ...gigs];
    saveGigs(updatedGigs);

    // Reset Form
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
      requirements: ""
    });

    setIsPostModalOpen(false);
    triggerToast("🎉 Your Hustle has been posted successfully! It is now live.");
  };

  // Initiate Application Modal
  const openApplyModal = (gig: Gig) => {
    setSelectedGigToApply(gig);
    setApplyForm({ name: "", message: `Hi ${gig.posterName}, I'm interested in your Hustle: "${gig.title}". I am ready to get to work!` });
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

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col antialiased text-white selection:bg-accent-teal selection:text-white">
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
              onClick={() => setIsPostModalOpen(true)}
              className="bg-accent-teal hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Post a Hustle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 space-y-4">
        
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
            <span className="text-xs text-teal-200/40 font-semibold font-mono hidden md:inline">
              Locally stored in Ghana
            </span>
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
              <h3 className="text-base font-bold text-white mb-1">No Hustles Found</h3>
              <p className="text-xs text-teal-200 opacity-70 max-w-sm mx-auto mb-4">
                {activeTab === "saved" 
                  ? "You haven't bookmarked any gigs yet. Add some to quickly access them later."
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
          onClick={() => setIsPostModalOpen(true)}
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

    </div>
  );
}
