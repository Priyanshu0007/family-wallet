"use client";
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { Shield, Smartphone, Trash2, Download, Upload, Info } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import ChangePinModal from '../pin/ChangePinModal';
import { getDecryptedCards } from '../../store/db';
import { importKeyFromBase64, exportKeyToBase64 } from '../../store/crypto';

export default function SettingsScreen() {
  const { resetApp, timeoutDuration, setTimeoutDuration } = usePinStore();
  const { loadCards, addCard } = useCardStore();
  const { addToast } = useUiStore();
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isChangePinModalOpen, setChangePinModalOpen] = useState(false);

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeoutDuration(Number(e.target.value));
  };

  const handleExport = async () => {
    try {
      const cards = await getDecryptedCards();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "family_wallet_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast('Data exported successfully', 'success');
    } catch (err) {
      addToast('Failed to export data', 'error');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          let imported = 0;
          for (const item of json) {
            // Re-encrypt by adding through store
            await addCard({
              bank: item.bank,
              variant: item.variant,
              type: item.type,
              number: item.number,
              expiry: item.expiry,
              cvv: item.cvv,
              holder: item.holder,
              network: item.network || 'Unknown',
              color: item.color || item.bank.toLowerCase(),
              notes: item.notes
            });
            imported++;
          }
          addToast(`Imported ${imported} cards successfully`, 'success');
          await loadCards();
        }
      } catch (err) {
        addToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 px-4 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
      <h2 className="text-2xl font-sora font-bold mb-8">Settings</h2>

      <div className="space-y-6">
        
        {/* Security */}
        <section>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-widest mb-3 ml-2">Security</h3>
          <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
            <button onClick={() => setChangePinModalOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors border-b border-border text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-medium">Change PIN</p>
                  <p className="text-sm text-text-secondary">Update your 6-digit access code</p>
                </div>
              </div>
            </button>
            <div className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="font-medium">Auto-lock Timeout</p>
                  <p className="text-sm text-text-secondary">
                    {timeoutDuration === 0 ? 'Immediately' : timeoutDuration === -1 ? 'Never' : `${timeoutDuration} minutes`} (background)
                  </p>
                </div>
              </div>
              <select 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={timeoutDuration}
                onChange={handleTimeoutChange}
              >
                <option value={0}>Immediately</option>
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={-1}>Never</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data */}
        <section>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-widest mb-3 ml-2">Data Management</h3>
          <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
            <button onClick={handleExport} className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors border-b border-border text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface text-text-primary flex items-center justify-center border border-border">
                  <Download size={20} />
                </div>
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-text-secondary">Download as JSON (decrypted)</p>
                </div>
              </div>
            </button>
            
            <label className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors border-b border-border cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface text-text-primary flex items-center justify-center border border-border">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-text-secondary">Upload a JSON backup</p>
                </div>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button onClick={() => setResetModalOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-danger/5 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <p className="font-medium text-danger">Clear All Data</p>
                  <p className="text-sm text-danger/80">Wipe database and reset PIN</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Info */}
        <section>
          <div className="bg-surface-elevated rounded-2xl border border-border p-4 flex gap-4 mt-8">
            <Info size={24} className="text-primary shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium mb-1">Offline First & Secure</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Family Wallet runs entirely on your device. Your data never leaves your browser. All sensitive card details are encrypted using AES-256-GCM before being stored.
              </p>
            </div>
          </div>
          <div className="text-center mt-8 text-text-muted text-xs">
            <p>Family Wallet v1.0.0</p>
            <p className="mt-1">Built with Next.js, Dexie & Tailwind</p>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={() => {
          resetApp();
          window.location.reload();
        }}
        title="Clear All Data?"
        message="This will completely wipe your wallet database and reset your PIN. This action cannot be undone."
        confirmText="Yes, Wipe Everything"
        isDanger={true}
      />

      <ChangePinModal 
        isOpen={isChangePinModalOpen} 
        onClose={() => setChangePinModalOpen(false)} 
      />
    </div>
  );
}
