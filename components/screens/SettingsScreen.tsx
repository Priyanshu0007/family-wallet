"use client";
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { Shield, Smartphone, Trash2, Download, Upload, Info, Users, Plus, ChevronDown, ChevronUp, User, Eye, EyeOff, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useState, useEffect } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import ChangePinModal from '../pin/ChangePinModal';
import { getDecryptedCards } from '../../store/db';
import { encryptWithPassword, decryptWithPassword } from '../../store/crypto';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Encryption export/import state
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportConfirmPassword, setExportConfirmPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [exportMode, setExportMode] = useState<'encrypted' | 'plaintext'>('encrypted');

  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeoutDuration(Number(e.target.value));
  };

  const executeExportEncrypted = async () => {
    if (!exportPassword) {
      addToast('Password is required', 'error');
      return;
    }
    if (exportPassword !== exportConfirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    try {
      const cardsData = await getDecryptedCards();
      const encryptedString = await encryptWithPassword(JSON.stringify(cardsData), exportPassword);
      
      const blob = new Blob([encryptedString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", "family_wallet_backup_encrypted.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
      
      addToast('Encrypted backup exported successfully', 'success');
      setExportModalOpen(false);
      setExportPassword('');
      setExportConfirmPassword('');
    } catch (err) {
      console.error(err);
      addToast('Failed to export encrypted data', 'error');
    }
  };

  const executeExportPlaintext = async () => {
    try {
      const cardsData = await getDecryptedCards();
      const blob = new Blob([JSON.stringify(cardsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", "family_wallet_backup_plaintext.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
      
      addToast('Plaintext backup exported successfully', 'success');
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to export data', 'error');
    }
  };

  const executeImportCards = async (cardsList: any[]) => {
    try {
      let imported = 0;
      for (const item of cardsList) {
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
          notes: item.notes,
          benefits: item.benefits || []
        });
        imported++;
      }
      addToast(`Imported ${imported} cards successfully`, 'success');
      await loadCards();
    } catch (err) {
      console.error(err);
      addToast('Failed to import cards into database', 'error');
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        
        // Check if this is an encrypted JSON
        if (json && typeof json === 'object' && json.encrypted === true) {
          setPendingImportContent(text);
          setImportPassword('');
          setImportError('');
          setImportModalOpen(true);
        } else if (Array.isArray(json)) {
          // Regular plaintext array import
          await executeImportCards(json);
        } else {
          addToast('Invalid backup file format', 'error');
        }
      } catch (err) {
        addToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleDecryptAndImport = async () => {
    if (!importPassword) {
      setImportError('Password is required');
      return;
    }
    try {
      setImportError('');
      const decryptedText = await decryptWithPassword(pendingImportContent, importPassword);
      const cardsList = JSON.parse(decryptedText);
      if (Array.isArray(cardsList)) {
        await executeImportCards(cardsList);
        setImportModalOpen(false);
        setPendingImportContent('');
        setImportPassword('');
      } else {
        setImportError('Invalid card list format in decrypted backup');
      }
    } catch (err) {
      console.error(err);
      setImportError('Incorrect password or corrupted file');
    }
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
              onClick={() => {
                if (cards.length === 0) {
                  addToast('No cards to export', 'info');
                } else {
                  setExportPassword('');
                  setExportConfirmPassword('');
                  setExportModalOpen(true);
                }
              }} 
              className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors border-b border-border text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface text-text-primary flex items-center justify-center border border-border">
                  <Download size={20} />
                </div>
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-text-secondary">Export cards as encrypted or plaintext JSON</p>
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
                  <p className="text-sm text-text-secondary">Restore cards from a JSON backup</p>
                </div>
              </div>
              <input type="file" accept=".json" onChange={handleImportFileSelect} className="hidden" />
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

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-border overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-sora font-semibold flex items-center gap-2">
                  <Download className="text-primary" size={20} />
                  <span>Backup Wallet Data</span>
                </h3>
              </div>

              {/* Tabs for Mode selection */}
              <div className="flex bg-surface-elevated p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setExportMode('encrypted')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    exportMode === 'encrypted'
                      ? 'bg-surface text-primary shadow-sm border border-border/40'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Encrypted (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('plaintext')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    exportMode === 'plaintext'
                      ? 'bg-surface text-danger shadow-sm border border-border/40'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Plaintext (Unsafe)
                </button>
              </div>

              {exportMode === 'encrypted' ? (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Protect your backup file using an encryption passphrase. You will need this exact passphrase to import the data back.
                  </p>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-semibold">Passphrase</label>
                    <div className="relative">
                      <input
                        type={showExportPassword ? "text" : "password"}
                        value={exportPassword}
                        onChange={(e) => setExportPassword(e.target.value)}
                        placeholder="Enter encryption passphrase"
                        className="w-full bg-surface border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowExportPassword(!showExportPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showExportPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-semibold">Confirm Passphrase</label>
                    <input
                      type={showExportPassword ? "text" : "password"}
                      value={exportConfirmPassword}
                      onChange={(e) => setExportConfirmPassword(e.target.value)}
                      placeholder="Confirm passphrase"
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                    <button
                      type="button"
                      onClick={() => setExportModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-elevated transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeExportEncrypted}
                      disabled={!exportPassword || exportPassword.length < 4 || exportPassword !== exportConfirmPassword}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/10"
                    >
                      <Lock size={14} />
                      <span>Export Encrypted</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-danger/8 border border-danger/20 rounded-xl p-4 flex gap-3 text-danger">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold mb-1">Security Warning</p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Exporting in plaintext will write all credit/debit card numbers, expiry dates, CVVs, and notes to the backup file in an unencrypted format. Anyone who gains access to this file can view all your sensitive data instantly.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                    <button
                      type="button"
                      onClick={() => setExportModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-elevated transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeExportPlaintext}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-danger hover:bg-danger/90 transition-all shadow-lg shadow-danger/10"
                    >
                      <Unlock size={14} />
                      <span>Export Plaintext</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setImportModalOpen(false);
                setPendingImportContent('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-border z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-sora font-semibold flex items-center gap-2">
                  <Lock className="text-violet-400" size={20} />
                  <span>Decrypt Backup</span>
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  This backup file is encrypted. Please enter the passphrase used during export to decrypt and restore your cards.
                </p>

                <div>
                  <label className="block text-xs text-text-muted mb-1 font-semibold">Passphrase</label>
                  <div className="relative">
                    <input
                      type={showImportPassword ? "text" : "password"}
                      value={importPassword}
                      onChange={(e) => {
                        setImportPassword(e.target.value);
                        if (importError) setImportError('');
                      }}
                      placeholder="Enter decryption passphrase"
                      className="w-full bg-surface border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowImportPassword(!showImportPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showImportPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {importError && (
                    <p className="text-danger text-xs mt-1.5 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>{importError}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setImportModalOpen(false);
                      setPendingImportContent('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDecryptAndImport}
                    disabled={!importPassword}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/10"
                  >
                    <Unlock size={14} />
                    <span>Decrypt & Import</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
