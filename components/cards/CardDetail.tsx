"use client";
import { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import BottomSheet from '../ui/BottomSheet';
import ConfirmModal from '../ui/ConfirmModal';
import CardVisual from './CardVisual';
import { copyToClipboard, getExpiryStatus } from '../../lib/cardUtils';
import { Copy, Edit2, Trash2, Eye, EyeOff, AlertTriangle, Clock } from 'lucide-react';

export default function CardDetail() {
  const { activeSheet, activeCardId, closeSheet, openSheet, addToast } = useUiStore();
  const { cards, deleteCard } = useCardStore();
  
  const [showFullNum, setShowFullNum] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const card = cards.find(c => c.id === activeCardId);
  const isOpen = activeSheet === 'cardDetail' && !!card;

  if (!card) return null;

  const expiryStatus = getExpiryStatus(card.expiry);

  const handleCopyNum = async () => {
    await copyToClipboard(card.number.replace(/\s/g, ''));
    addToast('Card number copied to clipboard', 'success');
  };

  const handleCopyCvv = async () => {
    await copyToClipboard(card.cvv);
    addToast('CVV copied to clipboard', 'success');
  };

  const handleDelete = async () => {
    await deleteCard(card.id);
    closeSheet();
    addToast('Card deleted', 'success');
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={closeSheet} title="Card Details">
        <div className="pb-8 animate-in fade-in duration-300">
          {expiryStatus === 'expired' && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 flex gap-3 items-center text-sm mb-6 font-sora">
              <AlertTriangle className="shrink-0 text-rose-400" size={20} />
              <span>This card has expired and is no longer active. Please verify details or delete if no longer in use.</span>
            </div>
          )}

          {expiryStatus === 'expiring' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3.5 flex gap-3 items-center text-sm mb-6 font-sora">
              <Clock className="shrink-0 text-amber-400 animate-pulse" size={20} />
              <span>This card is expiring soon. Please check if a replacement has been issued by your bank.</span>
            </div>
          )}

          <div className="mb-8">
            <CardVisual card={card} showFullNumber={showFullNum} />
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-surface-elevated rounded-xl p-4 flex justify-between items-center border border-border">
              <div>
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Card Number</p>
                <p className="font-mono text-lg">{showFullNum ? card.number : `•••• •••• •••• ${card.number.replace(/\s/g, '').slice(-4)}`}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFullNum(!showFullNum)} className="p-2 text-text-secondary hover:text-primary transition-colors bg-surface rounded-lg">
                  {showFullNum ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button onClick={handleCopyNum} className="p-2 text-text-secondary hover:text-primary transition-colors bg-surface rounded-lg">
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Valid Thru</p>
                <p className={`font-mono text-lg ${
                  expiryStatus === 'expired' ? 'text-danger' : 
                  expiryStatus === 'expiring' ? 'text-warning' : 'text-text-primary'
                }`}>
                  {card.expiry}
                </p>
              </div>

              <div className="bg-surface-elevated rounded-xl p-4 border border-border flex justify-between items-center">
                <div>
                  <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">CVV</p>
                  <p className="font-mono text-lg">{showCvv ? card.cvv : '•••'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCvv(!showCvv)} className="p-2 text-text-secondary hover:text-primary transition-colors bg-surface rounded-lg">
                    {showCvv ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button onClick={handleCopyCvv} className="p-2 text-text-secondary hover:text-primary transition-colors bg-surface rounded-lg">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-elevated rounded-xl p-4 border border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Cardholder</p>
                <p className="font-medium text-text-primary">{card.holder}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Type</p>
                <p className="font-medium text-text-primary">{card.type} • {card.network}</p>
              </div>
            </div>
            
            {card.notes && (
              <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Notes</p>
                <p className="text-sm text-text-primary">{card.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => openSheet('editCard', card.id)}
              className="flex-1 bg-surface-elevated hover:bg-border text-text-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-border"
            >
              <Edit2 size={18} /> Edit
            </button>
            <button 
              onClick={() => setDeleteModalOpen(true)}
              className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-danger/20"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Card?"
        message={`Are you sure you want to delete this ${card.bank} card ending in ${card.number.slice(-4)}?`}
        confirmText="Delete"
        isDanger={true}
      />
    </>
  );
}
