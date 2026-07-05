import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Save, MapPin, Phone, Trash2, Check, Info, Sun, Moon, Palette, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { LOCATIONS } from '../data';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  onClear: () => void;
  currentProfile: UserProfile | null;
  triggerToast: (msg: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  bgType: string;
  setBgType: (bgType: string) => void;
  customBgUrl: string;
  setCustomBgUrl: (url: string) => void;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  onSave,
  onClear,
  currentProfile,
  triggerToast,
  theme,
  setTheme,
  bgType,
  setBgType,
  customBgUrl,
  setCustomBgUrl
}: ProfileDrawerProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    location: 'East Legon, Accra',
    customLocation: ''
  });

  // Sync state with current profile when opened
  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile);
    } else {
      setProfile({
        name: '',
        phone: '',
        location: 'East Legon, Accra',
        customLocation: ''
      });
    }
  }, [currentProfile, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    onSave(profile);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your saved profile? This will remove your auto-fill data.")) {
      onClear();
      setProfile({
        name: '',
        phone: '',
        location: 'East Legon, Accra',
        customLocation: ''
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-sm cursor-pointer"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-dark-surface border-l border-teal-800/50 shadow-2xl z-50 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-teal-900/40 bg-dark-bg/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-accent-teal/10 border border-accent-teal/30 text-accent-teal">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Your Freelancer Profile</h2>
                  <p className="text-[10px] text-teal-300">Set up pre-fill details for posting & applying</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-teal-400 hover:text-white hover:bg-teal-900/40 border border-teal-900/40 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content / Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* Highlight Note */}
              <div className="bg-teal-950/30 p-4 rounded-2xl border border-teal-900/40 flex items-start space-x-3">
                <Info className="text-accent-teal mt-0.5 flex-shrink-0" size={16} />
                <div className="text-[11px] text-teal-200/80 leading-relaxed font-medium">
                  <strong>Auto-Fill Active:</strong> Saving your profile will automatically pre-fill your name when applying to hustles, as well as your name, contact phone, and location when posting new opportunities!
                </div>
              </div>

              {/* Input: Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider flex items-center space-x-1">
                  <User size={12} className="text-accent-teal" />
                  <span>Full Name or Brand Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kwame Mensah or Accra Tech Hub"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-teal-700 focus:outline-none transition-all font-bold"
                  required
                />
              </div>

              {/* Input: WhatsApp Phone Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider flex items-center space-x-1">
                  <Phone size={12} className="text-accent-teal" />
                  <span>WhatsApp Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0244123456 or 233553987654"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-teal-700 focus:outline-none transition-all font-bold"
                />
                <span className="text-[9px] text-teal-300/40 block">
                  Ghanaian format. Used as pre-filled poster contact or when applying.
                </span>
              </div>

              {/* Input: Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider flex items-center space-x-1">
                  <MapPin size={12} className="text-accent-teal" />
                  <span>Your Base Location</span>
                </label>
                <select
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs text-teal-100 font-bold focus:outline-none transition-all cursor-pointer"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name} className="bg-dark-surface text-white">
                      {loc.name} ({loc.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Location if other/custom */}
              {profile.location === 'Other / Custom' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block">
                    Specify Custom Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kumasi Airport area, Ashanti"
                    value={profile.customLocation || ''}
                    onChange={(e) => setProfile({ ...profile, customLocation: e.target.value })}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-teal-700 focus:outline-none transition-all font-bold"
                  />
                </div>
              )}

              {/* Personalization divider */}
              <div className="pt-4 border-t border-teal-900/30">
                <h3 className="text-[11px] font-extrabold uppercase text-accent-teal tracking-wider mb-4 flex items-center space-x-1.5">
                  <Palette size={13} />
                  <span>App Personalization & Styling</span>
                </h3>
              </div>

              {/* Theme Selector (Light vs Dark) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1">
                  App Palette Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      triggerToast('🌙 Dark Mode activated!');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-accent-teal/10 border-accent-teal text-white shadow-md'
                        : 'bg-dark-bg/40 border-teal-900/50 text-teal-300 hover:text-white'
                    }`}
                  >
                    <Moon size={14} />
                    <span>Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      triggerToast('☀️ Light Mode activated!');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white border-accent-teal text-teal-950 shadow-md'
                        : 'bg-dark-bg/40 border-teal-900/50 text-teal-300 hover:text-white'
                    }`}
                  >
                    <Sun size={14} />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              {/* Background Picker */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider block mb-1">
                  Custom Workspace Background
                </label>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Preset 1: None */}
                  <button
                    type="button"
                    onClick={() => setBgType('none')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'none'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span>Solid Default</span>
                    {bgType === 'none' && <Check size={12} className="text-accent-teal" />}
                  </button>

                  {/* Preset 2: Ghana Sunset */}
                  <button
                    type="button"
                    onClick={() => setBgType('sunset')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'sunset'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-teal-800 via-yellow-500 to-rose-600 inline-block" />
                      <span>Ghana Sunset</span>
                    </span>
                    {bgType === 'sunset' && <Check size={12} className="text-accent-teal" />}
                  </button>

                  {/* Preset 3: Cyber Mesh */}
                  <button
                    type="button"
                    onClick={() => setBgType('cyber')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'cyber'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#004d40] to-accent-teal inline-block" />
                      <span>Cyber Mesh</span>
                    </span>
                    {bgType === 'cyber' && <Check size={12} className="text-accent-teal" />}
                  </button>

                  {/* Preset 4: Deep Ocean */}
                  <button
                    type="button"
                    onClick={() => setBgType('ocean')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'ocean'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-900 to-[#00897b] inline-block" />
                      <span>Deep Ocean</span>
                    </span>
                    {bgType === 'ocean' && <Check size={12} className="text-accent-teal" />}
                  </button>

                  {/* Preset 5: Abstract Unsplash */}
                  <button
                    type="button"
                    onClick={() => setBgType('abstract')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'abstract'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <ImageIcon size={12} className="text-teal-400" />
                      <span>Cosmic Wave</span>
                    </span>
                    {bgType === 'abstract' && <Check size={12} className="text-accent-teal" />}
                  </button>

                  {/* Preset 6: Custom URL */}
                  <button
                    type="button"
                    onClick={() => setBgType('custom')}
                    className={`p-2.5 rounded-xl border font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      bgType === 'custom'
                        ? 'border-accent-teal bg-accent-teal/10 text-white'
                        : 'border-teal-900/40 bg-dark-bg/30 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <Palette size={12} className="text-ghana-gold" />
                      <span>Custom URL</span>
                    </span>
                    {bgType === 'custom' && <Check size={12} className="text-accent-teal" />}
                  </button>
                </div>

                {/* Custom URL Input if "custom" is selected */}
                {bgType === 'custom' && (
                  <div className="space-y-1.5 mt-2 animate-fadeIn">
                    <input
                      type="url"
                      placeholder="Paste image link e.g. https://domain.com/image.jpg"
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2 px-3 text-xs text-white placeholder-teal-700 focus:outline-none transition-all font-bold"
                    />
                    <span className="text-[9px] text-teal-300/40 block">
                      Provide a direct web link (HTTPS) to any image of your choice to style your dashboard.
                    </span>
                  </div>
                )}
              </div>

            </form>

            {/* Footer buttons */}
            <div className="p-6 border-t border-teal-900/40 bg-dark-bg/30 flex items-center justify-between gap-3">
              {currentProfile && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl border border-rose-900 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Clear Profile</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-accent-teal hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
