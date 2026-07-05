import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Save, MapPin, Phone, Trash2, Check, Info } from 'lucide-react';
import { UserProfile } from '../types';
import { LOCATIONS } from '../data';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  onClear: () => void;
  currentProfile: UserProfile | null;
  triggerToast: (msg: string) => void;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  onSave,
  onClear,
  currentProfile,
  triggerToast
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
