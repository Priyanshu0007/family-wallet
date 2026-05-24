"use client";
import { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import BottomSheet from '../ui/BottomSheet';
import ConfirmModal from '../ui/ConfirmModal';
import CardVisual from './CardVisual';
import { copyToClipboard, getExpiryStatus, getCardUtilization, getBillDueStatus } from '../../lib/cardUtils';
import { Copy, Edit2, Trash2, Eye, EyeOff, AlertTriangle, Clock, Trophy, Calendar, Pin } from 'lucide-react';

export default function CardDetail() {
  const { activeSheet, activeCardId, closeSheet, openSheet, addToast } = useUiStore();
  const { cards, deleteCard, togglePinCard } = useCardStore();
  
  const [showFullNum, setShowFullNum] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const card = cards.find(c => c.id === activeCardId);
  const isOpen = activeSheet === 'cardDetail' && !!card;

  if (!card) return null;

  const expiryStatus = getExpiryStatus(card.expiry);
  const utilization = getCardUtilization(card.usedCredit, card.limit);
  const billStatus = getBillDueStatus(card.dueDateDay);

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

  const handleTogglePin = async () => {
    await togglePinCard(card.id);
    addToast(card.isPinned ? 'Card unpinned from favorites' : 'Card pinned to favorites', 'success');
  };

  const pinButton = (
    <button
      onClick={handleTogglePin}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
        card.isPinned 
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-450 border border-amber-500/20' 
          : 'bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary border border-border/80'
      }`}
      title={card.isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
    >
      <Pin size={15} className={`transition-transform duration-300 ${card.isPinned ? 'fill-amber-400 rotate-45 text-amber-400' : ''}`} />
    </button>
  );

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={closeSheet} title="Card Details" headerActions={pinButton}>
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
            {card.type === 'Credit' && card.limit !== undefined && card.limit > 0 && (
              <div className="bg-surface-elevated/70 rounded-xl p-4 border border-border flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Credit Limit Details</span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    utilization >= 75 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                    utilization >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {utilization}% Utilized
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Used Credit</span>
                    <span className="font-mono text-base font-bold text-text-primary">₹{(card.usedCredit || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total Limit</span>
                    <span className="font-mono text-base font-bold text-text-secondary">₹{card.limit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="h-1.5 bg-surface rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${
                      utilization >= 75 ? 'from-rose-500 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                      utilization >= 50 ? 'from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                      'from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs mt-1 pt-2 border-t border-border/40">
                  <span className="text-text-muted">Available Credit</span>
                  <span className="font-mono font-bold text-emerald-400">₹{(card.limit - (card.usedCredit || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {card.type === 'Credit' && billStatus && (
              <div className="bg-surface-elevated/70 rounded-xl p-4 border border-border flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13.5} className="text-text-muted/70" />
                    <span>Billing Due Date</span>
                  </span>
                  
                  {billStatus.dueToday ? (
                    <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Due TODAY</span>
                    </span>
                  ) : billStatus.dueSoon ? (
                    <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Due in {billStatus.daysRemaining} days</span>
                    </span>
                  ) : (
                    <span className="text-text-secondary font-semibold bg-surface/80 border border-border/40 px-2.5 py-0.5 rounded-full text-xs font-mono">
                      Due in {billStatus.daysRemaining} days
                    </span>
                  )}
                </div>
                
                <p className="text-xs font-semibold text-text-secondary">
                  Your monthly bill is due on the <span className="text-text-primary font-bold font-mono">{billStatus.dueDay}th</span> of every month.
                </p>
              </div>
            )}

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
            
            {(card.rewardPoints ?? 0) > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/20">
                      <Trophy size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-300/70 font-medium uppercase tracking-wider">Reward Points</p>
                      <p className="font-mono text-lg font-bold text-amber-300">{(card.rewardPoints ?? 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Est. Value <span className="text-amber-400/50">@₹{card.pointValue ?? 0.25}/pt</span></p>
                    <p className="text-base font-bold font-mono text-amber-400">₹{((card.rewardPoints ?? 0) * (card.pointValue ?? 0.25)).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            )}

            {card.notes && (
              <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Notes</p>
                <p className="text-sm text-text-primary">{card.notes}</p>
              </div>
            )}

            {card.benefits && card.benefits.length > 0 && (
              <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Benefits & Rewards</p>
                <div className="flex flex-col gap-2">
                  {card.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-text-primary/90">{benefit}</span>
                    </div>
                  ))}
                </div>
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
