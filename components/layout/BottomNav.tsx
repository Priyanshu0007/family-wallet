"use client";
import { CreditCard, BarChart2, Settings, Users } from 'lucide-react';

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: NavProps) {
  const tabs = [
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border pb-safe z-30">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
