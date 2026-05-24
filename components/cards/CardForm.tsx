"use client";
import { useState, useEffect, useRef } from 'react';
import BottomSheet from '../ui/BottomSheet';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { BANKS, PREMIUM_THEMES } from '../../lib/constants';
import { getCardNetwork, formatCardNumber } from '../../lib/cardUtils';
import { Card } from '../../store/db';
import { Camera, Loader2, Plus, Trash2, Pin } from 'lucide-react';

export default function CardForm() {
  const { activeSheet, activeCardId, closeSheet, addToast } = useUiStore();
  const { cards, addCard, updateCard } = useCardStore();
  const { members } = useFamilyStore();
  
  const isEdit = activeSheet === 'editCard';
  const isOpen = activeSheet === 'addCard' || isEdit;

  const [formData, setFormData] = useState<Partial<Card>>({
    bank: '', variant: '', type: 'Credit', number: '', expiry: '', cvv: '', holder: '', notes: '', color: 'bank-default', benefits: [], rewardPoints: 0, pointValue: 0.25, limit: undefined, usedCredit: undefined, dueDateDay: undefined, isPinned: false
  });
  
  const [network, setNetwork] = useState('Unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        if (isEdit && activeCardId) {
          const card = cards.find(c => c.id === activeCardId);
          if (card) {
            setFormData({
              ...card,
              color: card.color || 'bank-default',
              benefits: card.benefits || []
            });
            setNetwork(card.network);
          }
        } else {
          setFormData({ 
            bank: '', 
            variant: '', 
            type: 'Credit', 
            number: '', 
            expiry: '', 
            cvv: '', 
            holder: members.length > 0 ? members[0].name : '', 
            notes: '',
            color: 'bank-default',
            benefits: [],
            rewardPoints: 0,
            pointValue: 0.25,
            limit: undefined,
            usedCredit: undefined,
            dueDateDay: undefined,
            isPinned: false
          });
          setNetwork('Unknown');
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, isEdit, activeCardId, cards, members]);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    addToast('Processing image...', 'info');

    try {
      const base64Image = await compressImage(file);
      addToast('Analyzing card with Gemini AI...', 'info');
      
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        bank: data.bank || prev.bank,
        variant: data.variant || prev.variant,
        number: data.number ? formatCardNumber(data.number.replace(/\D/g, '').slice(0, 16)) : prev.number,
        expiry: data.expiry || prev.expiry,
        holder: data.holder || prev.holder || (members.length > 0 ? members[0].name : ''),
      }));

      if (data.network && data.network !== 'Unknown') {
        setNetwork(data.network);
      }

      addToast('Card scanned successfully! Please review details.', 'success');
    } catch (err: any) {
      console.error('[Scan Error]:', err);
      addToast(err.message || 'Failed to scan card', 'error');
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1024;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = (h * maxDim) / w;
            w = maxDim;
          } else if (h > maxDim) {
            w = (w * maxDim) / h;
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const addBenefit = () => {
    if (!benefitInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      benefits: [...(prev.benefits || []), benefitInput.trim()]
    }));
    setBenefitInput('');
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: (prev.benefits || []).filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      const clean = value.replace(/\D/g, '').slice(0, 19);
      const formatted = formatCardNumber(clean);
      setFormData(prev => ({ ...prev, number: formatted }));
      setNetwork(getCardNetwork(clean));
      return;
    }
    
    if (name === 'expiry') {
      let clean = value.replace(/\D/g, '').slice(0, 4);
      const isDeleting = value.length < (formData.expiry || '').length;
      
      if (clean.length >= 2) {
        if (isDeleting && value.length === 2) {
          clean = clean.slice(0, 2);
        } else {
          const m = parseInt(clean.slice(0, 2), 10);
          if (m > 12) clean = '12' + clean.slice(2);
          if (m === 0) clean = '01' + clean.slice(2);
          clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
        }
      }
      setFormData(prev => ({ ...prev, expiry: clean }));
      return;
    }

    if (name === 'cvv') {
      const clean = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, cvv: clean }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isCredit = formData.type === 'Credit';
      const trimmedData = {
        ...formData,
        bank: formData.bank?.trim() || '',
        variant: formData.variant?.trim() || '',
        holder: formData.holder?.trim() || '',
        notes: formData.notes?.trim() || '',
        limit: isCredit && formData.limit !== undefined && (formData.limit as any) !== '' ? parseFloat(formData.limit as any) : undefined,
        usedCredit: isCredit && formData.usedCredit !== undefined && (formData.usedCredit as any) !== '' ? parseFloat(formData.usedCredit as any) : undefined,
        dueDateDay: isCredit && formData.dueDateDay !== undefined && (formData.dueDateDay as any) !== '' ? parseInt(formData.dueDateDay as any, 10) : undefined,
      };

      const finalColor = trimmedData.color && trimmedData.color.includes('from-')
        ? trimmedData.color
        : trimmedData.bank.toLowerCase();

      if (isEdit && activeCardId) {
        await updateCard({ ...trimmedData, id: activeCardId, network, color: finalColor } as Card);
        addToast('Card updated successfully', 'success');
      } else {
        await addCard({ ...trimmedData, network, color: finalColor } as Omit<Card, 'id' | 'addedAt'>);
        addToast('Card added successfully', 'success');
      }
      closeSheet();
    } catch (err) {
      addToast('Error saving card', 'error');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={closeSheet} title={isEdit ? 'Edit Card' : 'Add New Card'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-8 animate-in fade-in duration-300">
        
        {/* Scan Trigger */}
        {!isEdit && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleScanClick}
              disabled={isScanning}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 hover:from-violet-500/20 hover:to-indigo-500/20 text-violet-300 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin text-violet-400" size={16} />
                  <span>Scanning Card...</span>
                </>
              ) : (
                <>
                  <Camera className="text-violet-400" size={16} />
                  <span>Scan Card with AI</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
            <input 
              required list="banks" name="bank" value={formData.bank} onChange={handleChange}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. HDFC"
            />
            <datalist id="banks">
              {BANKS.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Card Variant</label>
            <input 
              required name="variant" value={formData.variant} onChange={handleChange}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Infinia"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Card Type</label>
          <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
            {['Credit', 'Debit'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type as 'Credit' | 'Debit' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  formData.type === type ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-text-secondary mb-1">
            <span>Card Number</span>
            {network !== 'Unknown' && <span className="text-primary font-bold">{network}</span>}
          </label>
          <input 
            required type="tel" name="number" value={formData.number} onChange={handleChange}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-primary transition-colors"
            placeholder="0000 0000 0000 0000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Expiry</label>
            <input 
              required type="tel" name="expiry" value={formData.expiry} onChange={handleChange}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-primary transition-colors"
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">CVV</label>
            <input 
              required type="password" name="cvv" value={formData.cvv} onChange={handleChange}
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono tracking-widest focus:outline-none focus:border-primary transition-colors"
              placeholder="•••"
            />
          </div>
        </div>

        {/* Custom Card Style Selector */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Card Style</label>
          <div className="flex flex-wrap gap-2 p-1.5 bg-surface rounded-xl border border-border overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color: 'bank-default' }))}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center ${
                (!formData.color || formData.color === 'bank-default' || !formData.color.includes('from-'))
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-surface-elevated hover:bg-border text-text-secondary border-border'
              }`}
            >
              Bank Default
            </button>
            {PREMIUM_THEMES.map(theme => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: theme.value }))}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.value} border transition-all duration-200 transform hover:scale-105 ${
                  formData.color === theme.value
                    ? 'border-primary ring-2 ring-primary/25 scale-110 shadow-md shadow-primary/25'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
                title={theme.name}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Cardholder</label>
          <input 
            required list="members" name="holder" value={formData.holder || ''} onChange={handleChange}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. John Doe"
          />
          <datalist id="members">
            {members.map(m => <option key={m.id} value={m.name} />)}
          </datalist>
        </div>

        {/* Credit Limits and Billing Section */}
        {formData.type === 'Credit' && (
          <div className="bg-surface-elevated/30 border border-border/60 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-350">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-sora">Credit Limit & Billing</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1">Credit Limit (₹)</label>
                <input 
                  type="number"
                  name="limit"
                  min="0"
                  value={formData.limit ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. 500000"
                />
              </div>
              <div>
                <label className="block text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1">Used Credit (₹)</label>
                <input 
                  type="number"
                  name="usedCredit"
                  min="0"
                  value={formData.usedCredit ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usedCredit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. 150000"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1">Bill Due Day of Month</label>
              <select
                name="dueDateDay"
                value={formData.dueDateDay ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDateDay: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Not Set (No Alerts)</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}th of the month</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Reward Points</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Points Balance</label>
              <input 
                type="number"
                name="rewardPoints"
                min="0"
                value={formData.rewardPoints || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, rewardPoints: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-amber-500/60 transition-colors"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">₹ per Point</label>
              <input 
                type="number"
                name="pointValue"
                min="0"
                step="0.05"
                value={formData.pointValue ?? 0.25}
                onChange={(e) => setFormData(prev => ({ ...prev, pointValue: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-amber-500/60 transition-colors"
                placeholder="0.25"
              />
            </div>
          </div>
          {(formData.rewardPoints || 0) > 0 && (
            <p className="text-xs text-amber-400/80 font-medium font-sora mt-2 text-right">
              ≈ ₹{((formData.rewardPoints || 0) * (formData.pointValue ?? 0.25)).toLocaleString('en-IN')} estimated value
            </p>
          )}
        </div>

        {/* Benefits Registry */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Benefits & Rewards</label>
          <div className="flex gap-2 mb-2">
            <input 
              type="text"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              placeholder="e.g. 5% cashback on Amazon"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBenefit();
                }
              }}
              className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={addBenefit}
              className="px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          
          {formData.benefits && formData.benefits.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 bg-surface-elevated/50 rounded-xl border border-border max-h-36 overflow-y-auto no-scrollbar">
              {formData.benefits.map((b, idx) => (
                <div key={idx} className="flex justify-between items-center bg-surface border border-border/60 rounded-lg px-3 py-1.5 text-xs text-text-primary">
                  <span className="truncate flex-1 pr-2">{b}</span>
                  <button
                    type="button"
                    onClick={() => removeBenefit(idx)}
                    className="text-text-muted hover:text-danger p-1 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
          <textarea 
            name="notes" value={formData.notes || ''} onChange={handleChange}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
            rows={2}
            placeholder="Any extra info..."
          />
        </div>

        {/* Pin to Favorites Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-elevated/45 rounded-xl border border-border/80 mt-1 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Pin size={16} className={formData.isPinned ? "fill-primary" : "rotate-45"} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary">Pin to Favorites</span>
              <span className="text-[10px] text-text-muted">Display this card at the top of the home screen</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
              formData.isPinned ? 'bg-primary' : 'bg-surface-elevated border border-border'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 left-1 transition-transform duration-200 ${
              formData.isPinned ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 transition-colors mt-2"
        >
          {isEdit ? 'Save Changes' : 'Add Card'}
        </button>
      </form>
    </BottomSheet>
  );
}
