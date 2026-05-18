"use client";
import BottomSheet from './BottomSheet';
import { useCardStore } from '../../store/cardStore';
import { useUiStore } from '../../store/uiStore';
import { Check } from 'lucide-react';

export default function SortModal() {
  const { sortBy, setSortBy } = useCardStore();
  const { activeSheet, closeSheet } = useUiStore();
  
  const options = [
    'Recently added',
    'Oldest first',
    'Expiry: soonest first',
    'Expiry: latest first',
    'Bank: A to Z',
    'Cardholder: A to Z'
  ];

  const isOpen = activeSheet === 'sort';

  return (
    <BottomSheet isOpen={isOpen} onClose={closeSheet} title="Sort By">
      <div className="flex flex-col gap-2 pb-8">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              setSortBy(opt);
              closeSheet();
            }}
            className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
              sortBy === opt ? 'bg-primary/10 text-primary' : 'hover:bg-surface-elevated text-text-primary'
            }`}
          >
            <span className="font-medium">{opt}</span>
            {sortBy === opt && <Check size={20} />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
