"use client";
import { useState, useEffect } from 'react';
import BottomSheet from '../ui/BottomSheet';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { BANKS } from '../../lib/constants';
import { getCardNetwork, formatCardNumber } from '../../lib/cardUtils';
import { Card } from '../../store/db';

export default function CardForm() {
  const { activeSheet, activeCardId, closeSheet, addToast } = useUiStore();
  const { cards, addCard, updateCard } = useCardStore();
  const { members } = useFamilyStore();
  
  const isEdit = activeSheet === 'editCard';
  const isOpen = activeSheet === 'addCard' || isEdit;

  const [formData, setFormData] = useState<Partial<Card>>({
    bank: '', variant: '', type: 'Credit', number: '', expiry: '', cvv: '', holder: '', notes: ''
  });
  
  const [network, setNetwork] = useState('Unknown');

  useEffect(() => {
    if (isOpen) {
      if (isEdit && activeCardId) {
        const card = cards.find(c => c.id === activeCardId);
        if (card) {
          setFormData(card);
          setNetwork(card.network);
        }
      } else {
        setFormData({ bank: '', variant: '', type: 'Credit', number: '', expiry: '', cvv: '', holder: members.length > 0 ? members[0].name : '', notes: '' });
        setNetwork('Unknown');
      }
    }
  }, [isOpen, isEdit, activeCardId, cards]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      const clean = value.replace(/\D/g, '').slice(0, 16);
      const formatted = formatCardNumber(clean);
      setFormData(prev => ({ ...prev, number: formatted }));
      setNetwork(getCardNetwork(clean));
      return;
    }
    
    if (name === 'expiry') {
      let clean = value.replace(/\D/g, '').slice(0, 4);
      if (clean.length >= 2) {
        const m = parseInt(clean.slice(0, 2), 10);
        if (m > 12) clean = '12' + clean.slice(2);
        if (m === 0) clean = '01' + clean.slice(2);
        clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
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
      if (isEdit && activeCardId) {
        await updateCard({ ...formData, id: activeCardId, network, color: formData.bank!.toLowerCase() } as Card);
        addToast('Card updated successfully', 'success');
      } else {
        await addCard({ ...formData, network, color: formData.bank!.toLowerCase() } as Omit<Card, 'id' | 'addedAt'>);
        addToast('Card added successfully', 'success');
      }
      closeSheet();
    } catch (err) {
      addToast('Error saving card', 'error');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={closeSheet} title={isEdit ? 'Edit Card' : 'Add New Card'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-8">
        
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

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Cardholder</label>
          <select 
            required name="holder" value={formData.holder} onChange={handleChange}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
          <textarea 
            name="notes" value={formData.notes || ''} onChange={handleChange}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
            rows={3}
            placeholder="Any extra info..."
          />
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
