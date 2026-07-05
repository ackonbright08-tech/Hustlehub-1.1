import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout 
} from '../services/googleAuth';
import { 
  listHustleHubSpreadsheets, 
  createHustleHubSpreadsheet, 
  exportGigsToSpreadsheet, 
  importGigsFromSpreadsheet,
  SpreadsheetInfo
} from '../services/googleSheets';
import { Gig } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Plus, 
  Info,
  ChevronDown
} from 'lucide-react';

interface GoogleSheetsSyncProps {
  currentGigs: Gig[];
  onImportGigs: (imported: Gig[], merge: boolean) => void;
  triggerToast: (msg: string) => void;
  onTokensChanged?: (token: string | null, sheetId: string | null) => void;
}

export default function GoogleSheetsSync({ currentGigs, onImportGigs, triggerToast, onTokensChanged }: GoogleSheetsSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [activeSheet, setActiveSheet] = useState<SpreadsheetInfo | null>(null);
  const [importMergeMode, setImportMergeMode] = useState<boolean>(true); // true = merge, false = replace

  // Track tokens and pass to parent
  useEffect(() => {
    if (onTokensChanged) {
      onTokensChanged(token, selectedSheetId || null);
    }
  }, [token, selectedSheetId, onTokensChanged]);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsLoading(false);
        // Load spreadsheets once token is verified
        fetchSpreadsheets(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchSpreadsheets = async (accessToken: string) => {
    try {
      const list = await listHustleHubSpreadsheets(accessToken);
      setSpreadsheets(list);
      
      // Auto-select the first available sheet if none is active
      if (list.length > 0 && !selectedSheetId) {
        setSelectedSheetId(list[0].id);
        setActiveSheet(list[0]);
      }
    } catch (err) {
      console.error('Error fetching sheets:', err);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        triggerToast('👋 Signed in with Google successfully!');
        await fetchSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast('❌ Google Sign-In failed or was cancelled');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out from Google Sheets? Your token will be cleared from memory.')) {
      try {
        await logout();
        setUser(null);
        setToken(null);
        setSpreadsheets([]);
        setActiveSheet(null);
        setSelectedSheetId('');
        triggerToast('Signed out of Google Workspace');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateSheet = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const newSheet = await createHustleHubSpreadsheet(token, `HustleHub Ghana Gigs (${new Date().toLocaleDateString()})`);
      setSpreadsheets(prev => [newSheet, ...prev]);
      setSelectedSheetId(newSheet.id);
      setActiveSheet(newSheet);
      triggerToast('🎉 Google Sheet created successfully in Google Drive!');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Failed to create Google Sheet');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSheetId(id);
    const found = spreadsheets.find(s => s.id === id);
    if (found) {
      setActiveSheet(found);
    } else {
      setActiveSheet(null);
    }
  };

  const handleExport = async () => {
    if (!token || !selectedSheetId) return;
    
    // Explicit user confirmation for destructive/mutating operation
    const confirmed = window.confirm(
      `Are you sure you want to Export ${currentGigs.length} gigs to Google Sheets? This will OVERWRITE any existing data in the first tab of your sheet.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      await exportGigsToSpreadsheet(token, selectedSheetId, currentGigs);
      triggerToast('🚀 Successfully exported all gigs to your Google Sheet!');
    } catch (err) {
      console.error(err);
      triggerToast('❌ Failed to export gigs. Make sure you have correct permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!token || !selectedSheetId) return;

    const actionText = importMergeMode 
      ? "MERGE with your local gigs (adding only unique gigs)" 
      : "REPLACE all local gigs entirely (erasing your current list)";

    const confirmed = window.confirm(
      `Are you sure you want to Import gigs from your Google Sheet? This will ${actionText}.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const imported = await importGigsFromSpreadsheet(token, selectedSheetId);
      if (imported.length === 0) {
        triggerToast('⚠️ No valid gigs were found in the selected spreadsheet.');
      } else {
        onImportGigs(imported, importMergeMode);
        triggerToast(`📥 Successfully imported ${imported.length} gigs!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast('❌ Failed to import. Verify your sheet has the correct format.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-dark-surface rounded-3xl shadow-xl border border-teal-800/50 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-teal-900/40 pb-3">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="text-accent-teal" size={20} />
          <div>
            <h2 className="text-sm font-bold text-teal-100 uppercase tracking-wider">
              Google Sheets Synchronization
            </h2>
            <p className="text-[10px] text-teal-300">Backup, share, and import gigs via Google Sheets</p>
          </div>
        </div>
        <span className="text-[9px] bg-accent-teal/10 border border-accent-teal/30 text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
          Cloud Sync
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-6 space-x-2">
          <RefreshCw className="animate-spin text-accent-teal" size={18} />
          <span className="text-xs text-teal-200">Verifying authorization state...</span>
        </div>
      ) : !user ? (
        <div className="space-y-4 py-2">
          <p className="text-xs text-teal-100/80 leading-relaxed font-medium">
            Connect HustleHub to your Google Drive and Google Sheets with permission from your account to instantly export your gig lists, sync with friends, or load community spreadsheet feeds.
          </p>
          
          <div className="flex justify-center">
            {/* Standard gsi-material-button styling */}
            <button 
              onClick={handleSignIn}
              className="gsi-material-button w-full sm:w-auto px-5 py-3 bg-white text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center space-x-3 transition-all hover:bg-gray-50 border border-gray-200 shadow-md active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 flex-shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="text-gray-900 font-semibold tracking-tight">Sign in with Google</span>
            </button>
          </div>
          
          <div className="bg-dark-bg/50 p-3 rounded-2xl border border-teal-900/40 flex items-start space-x-2">
            <Info className="text-accent-teal mt-0.5 flex-shrink-0" size={14} />
            <span className="text-[10px] text-teal-200/60 leading-relaxed font-medium">
              We strictly respect your privacy. No credentials or personal info are ever stored outside your local browser.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* User Profile */}
          <div className="flex items-center justify-between bg-dark-bg/60 p-3 rounded-2xl border border-teal-950/60">
            <div className="flex items-center space-x-2.5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full border border-teal-800/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-teal text-white flex items-center justify-center font-bold text-sm">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white">{user.displayName || 'Google User'}</p>
                <p className="text-[10px] text-teal-300 font-mono">{user.email}</p>
              </div>
            </div>
            
            <button 
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-teal-400 hover:text-white hover:bg-teal-900/40 border border-teal-900/60 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Spreadsheet Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-teal-200/60 tracking-wider">
                Active Google Sheet
              </label>
              
              <button
                onClick={handleCreateSheet}
                disabled={isSyncing}
                className="text-[10px] font-bold text-accent-teal hover:text-teal-300 flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={12} />
                <span>Create New Sheet</span>
              </button>
            </div>

            {spreadsheets.length === 0 ? (
              <div className="bg-dark-bg/40 border border-dashed border-teal-900 p-4 rounded-2xl text-center">
                <p className="text-[11px] text-teal-200/70 mb-2 font-medium">No HustleHub spreadsheets detected in Google Drive.</p>
                <button
                  onClick={handleCreateSheet}
                  disabled={isSyncing}
                  className="bg-accent-teal hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Initial Sheet</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedSheetId}
                    onChange={handleSheetChange}
                    disabled={isSyncing}
                    className="w-full bg-dark-bg border border-teal-900 focus:border-accent-teal rounded-xl py-2.5 px-3.5 text-xs font-bold focus:outline-none transition-all text-teal-100 appearance-none cursor-pointer"
                  >
                    {spreadsheets.map((sheet) => (
                      <option key={sheet.id} value={sheet.id} className="bg-dark-surface text-white">
                        {sheet.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-teal-400">
                    <ChevronDown size={14} />
                  </span>
                </div>

                {activeSheet?.webViewLink && (
                  <a
                    href={activeSheet.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-[10px] font-semibold text-ghana-gold hover:underline"
                  >
                    <span>Open in Google Sheets</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sync operations */}
          {spreadsheets.length > 0 && (
            <div className="space-y-3.5 pt-1.5 border-t border-teal-900/40">
              {/* Import Options */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-teal-200/80 font-semibold">Import Merge Mode</span>
                <div className="flex bg-dark-bg rounded-lg p-0.5 border border-teal-900/60">
                  <button
                    onClick={() => setImportMergeMode(true)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      importMergeMode ? 'bg-accent-teal text-white' : 'text-teal-300'
                    }`}
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => setImportMergeMode(false)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      !importMergeMode ? 'bg-ghana-gold text-dark-bg' : 'text-teal-300'
                    }`}
                  >
                    Replace
                  </button>
                </div>
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Export Gigs Button */}
                <button
                  onClick={handleExport}
                  disabled={isSyncing || currentGigs.length === 0}
                  className="bg-accent-teal hover:bg-teal-600 active:scale-95 disabled:opacity-50 text-white p-3 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center space-y-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isSyncing ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} className="text-ghana-gold" />
                  )}
                  <span>Export to Sheet</span>
                </button>

                {/* Import Gigs Button */}
                <button
                  onClick={handleImport}
                  disabled={isSyncing}
                  className="bg-dark-card border border-teal-900 hover:border-teal-700 active:scale-95 disabled:opacity-50 text-white p-3 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center space-y-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isSyncing ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Download size={16} className="text-accent-teal" />
                  )}
                  <span>Import from Sheet</span>
                </button>
              </div>

              {/* Payout metrics info card */}
              <div className="bg-teal-950/40 p-3 rounded-2xl border border-teal-900/40 flex items-start space-x-2">
                <Info className="text-accent-teal mt-0.5 flex-shrink-0" size={13} />
                <div className="text-[10px] text-teal-200/80 leading-relaxed font-medium">
                  <strong>Exporting</strong> writes your locally posted and initialized gigs into the selected spreadsheet. <strong>Importing</strong> reads row entries from the spreadsheet to populate your feed instantly.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
