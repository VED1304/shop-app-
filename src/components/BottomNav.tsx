import React from 'react';
import { Home, ShoppingBag, MessageSquare, User, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export default function BottomNav({ activeTab, setActiveTab, isAdmin }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'products', icon: ShoppingBag, label: 'Shop' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-4 py-2 flex justify-around items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTab === tab.id ? 'text-black' : 'text-black/40'
          }`}
        >
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
