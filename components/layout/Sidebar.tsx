"use client";
import { CreditCard, BarChart2, Settings, Wallet, Sparkles } from 'lucide-react';

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: NavProps) {
  const tabs = [
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'ai', label: 'AI Advisor', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface h-full fixed left-0 top-0 pt-6 z-20">
      <div className="flex items-center gap-3 px-6 mb-12">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
          <Wallet size={24} />
        </div>
        <h1 className="font-sora font-bold text-xl">Tijori 🔐</h1>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const isAi = id === 'ai';
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? isAi
                    ? 'bg-violet-500/10 text-violet-400 font-semibold'
                    : 'bg-primary/10 text-primary font-semibold' 
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm">{label}</span>
              {isAi && !isActive && (
                <span className="ml-auto text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400">
                  new
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
