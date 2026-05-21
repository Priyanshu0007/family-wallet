"use client";
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { Shield, Smartphone, Trash2, Download, Upload, Info, Users, Plus, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import ChangePinModal from '../pin/ChangePinModal';
import { getDecryptedCards } from '../../store/db';
import { importKeyFromBase64, exportKeyToBase64 } from '../../store/crypto';

export default function SettingsScreen() {
  const { resetApp, timeoutDuration, setTimeoutDuration } = usePinStore();
  const { loadCards, addCard, cards } = useCardStore();
  const { members, loadMembers, addMember, deleteMember } = useFamilyStore();
  const { addToast } = useUiStore();
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isChangePinModalOpen, setChangePinModalOpen] = useState(false);
  const [isFamilyOpen, setFamilyOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('');
  const [memberColor, setMemberColor] = useState('#3b82f6');

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeoutDuration(Number(e.target.value));
  };

  const handleExport = async () => {
    try {
      const cards = await getDecryptedCards();
      const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", "family_wallet_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberRelation.trim()) {
      addToast('Name and relation are required', 'error');
      return;
    }
    await addMember({ name: memberName, relation: memberRelation, color: memberColor });
    setMemberName('');
    setMemberRelation('');
    setMemberColor('#3b82f6');
    setIsAddingMember(false);
    addToast('Family member added', 'success');
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const hasCards = cards.some(c => c.holder === name);
    if (hasCards) {
      addToast(`Cannot remove ${name} because they have registered cards`, 'error');
      return;
    }

    if (confirm(`Remove ${name}?`)) {
      await deleteMember(id);
      addToast('Family member removed', 'success');
    }
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

        {/* Family Members */}
        <section>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-widest mb-3 ml-2">Family Members</h3>
          <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
            {/* Accordion Header */}
            <button
              onClick={() => setFamilyOpen(!isFamilyOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-medium">Manage Members</p>
                  <p className="text-sm text-text-secondary">
                    {members.length} member{members.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
              {isFamilyOpen ? (
                <ChevronUp size={20} className="text-text-muted" />
              ) : (
                <ChevronDown size={20} className="text-text-muted" />
              )}
            </button>

            {/* Accordion Body */}
            {isFamilyOpen && (
              <div className="border-t border-border">
                {/* Add Member Button */}
                <div className="p-4 border-b border-border">
                  {!isAddingMember ? (
                    <button
                      onClick={() => setIsAddingMember(true)}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors w-full justify-center"
                    >
                      <Plus size={16} />
                      <span>Add Member</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddMember} className="space-y-3">
                      <h4 className="font-sora font-semibold text-sm">New Family Member</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Name</label>
                          <input
                            type="text"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                            placeholder="e.g. John Doe"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Relation</label>
                          <input
                            type="text"
                            value={memberRelation}
                            onChange={(e) => setMemberRelation(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                            placeholder="e.g. Spouse, Child"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Color</label>
                        <input
                          type="color"
                          value={memberColor}
                          onChange={(e) => setMemberColor(e.target.value)}
                          className="w-full h-10 bg-surface border border-border rounded-xl p-1 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingMember(false)}
                          className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Members List */}
                {members.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
                      <User size={24} />
                    </div>
                    <p className="text-sm text-text-muted">No family members yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-sora font-bold text-sm"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-text-muted">{member.relation}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="text-text-muted hover:text-danger p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-danger/10"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Data */}
        <section>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-widest mb-3 ml-2">Data Management</h3>
          <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
            <button 
              type="button"
              onClick={handleExport} 
              className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors border-b border-border text-left"
            >
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

            <button 
              type="button"
              onClick={() => setResetModalOpen(true)} 
              className="w-full flex items-center justify-between p-4 hover:bg-danger/5 transition-colors text-left"
            >
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
                Tijori runs entirely on your device. Your data never leaves your browser. All sensitive card details are encrypted using AES-256-GCM before being stored.
              </p>
            </div>
          </div>
          <div className="text-center mt-8 text-text-muted text-xs">
            <p>Tijori v1.0.0</p>
            <p className="mt-1">Built with Next.js, Dexie & Tailwind</p>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={async () => {
          await resetApp();
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
