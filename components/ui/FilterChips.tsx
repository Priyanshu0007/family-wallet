"use client";
import { useCardStore } from '../../store/cardStore';
import { HOLDERS } from '../../lib/constants';

export default function FilterChips() {
  const { filter, setFilter } = useCardStore();
  
  const options = ['All', ...HOLDERS, 'Credit', 'Debit', '⚠️ Expiring', '❌ Expired'];

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-3 border-b border-border bg-background/95 backdrop-blur z-20 sticky top-16 md:top-0">
      {options.map(opt => {
        const isActive = filter === opt;
        return (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-primary text-white' 
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
