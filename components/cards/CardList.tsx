"use client";
import { useCardStore } from '../../store/cardStore';
import CardItem from './CardItem';
import { AnimatePresence } from 'framer-motion';
import { getExpiryStatus } from '../../lib/cardUtils';

export default function CardList() {
  const { cards, filter, sortBy, searchQuery, isLoading } = useCardStore();

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading cards...</div>;
  }

  // Filter
  let filtered = cards;
  if (filter !== 'All') {
    if (filter === 'Credit' || filter === 'Debit') {
      filtered = filtered.filter(c => c.type === filter);
    } else if (filter === '⚠️ Expiring') {
      filtered = filtered.filter(c => getExpiryStatus(c.expiry) === 'expiring');
    } else if (filter === '❌ Expired') {
      filtered = filtered.filter(c => getExpiryStatus(c.expiry) === 'expired');
    } else {
      // Holder
      filtered = filtered.filter(c => c.holder === filter);
    }
  }

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(c => 
      c.bank.toLowerCase().includes(q) ||
      c.variant.toLowerCase().includes(q) ||
      c.holder.toLowerCase().includes(q) ||
      c.number.replace(/\s/g, '').endsWith(q)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'Oldest first': return a.addedAt - b.addedAt;
      case 'Expiry: soonest first': {
        const [am, ay] = a.expiry.split('/');
        const [bm, by] = b.expiry.split('/');
        return (parseInt(ay) * 12 + parseInt(am)) - (parseInt(by) * 12 + parseInt(bm));
      }
      case 'Expiry: latest first': {
        const [am, ay] = a.expiry.split('/');
        const [bm, by] = b.expiry.split('/');
        return (parseInt(by) * 12 + parseInt(bm)) - (parseInt(ay) * 12 + parseInt(am));
      }
      case 'Bank: A to Z': return a.bank.localeCompare(b.bank);
      case 'Cardholder: A to Z': return a.holder.localeCompare(b.holder);
      case 'Recently added':
      default: return b.addedAt - a.addedAt;
    }
  });

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-text-muted flex flex-col items-center">
        <div className="w-24 h-24 bg-surface-elevated rounded-full mb-6 flex items-center justify-center border border-border">
          <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p className="font-medium text-lg text-text-primary mb-2">No cards found</p>
        <p className="text-sm">Try adjusting your filters or add a new card.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <AnimatePresence mode="popLayout">
        {filtered.map(card => (
          <CardItem key={card.id} card={card} />
        ))}
      </AnimatePresence>
    </div>
  );
}
