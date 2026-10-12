import React, { useState } from 'react';
import { Menu, Search, Brain, Network, GitCompare, History, Settings as SettingsIcon, Cpu, X } from 'lucide-react';
import { KnowBriefLogo } from './KnowBriefLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  analyzedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, analyzedCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { id: 'dashboard', label: 'Home' },
    { id: 'discover', label: 'Discover' },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'history', label: 'Saved', icon: History, badge: analyzedCount },
  ];
  const secondaryItems = [
    { id: 'insights', label: 'Technical Insights', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="w-full bg-[#171717]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="masthead flex items-center justify-between min-h-[84px] gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            aria-label="KnowBrief home"
            className="flex shrink-0 items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd429]"
          >
            <KnowBriefLogo className="h-10 w-[154px] sm:w-[190px]" />
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#ffd429]/10 text-[#ffd429] border border-[#ffd429]/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffd429]' : 'text-slate-400'}`} />}
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#ffd429]/20 text-[#ffd429] text-[10px] font-mono rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <button onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">More</button>
              {menuOpen && <div className="absolute right-0 top-full mt-2 z-50 min-w-48 rounded-lg border border-slate-700 bg-[#202020] p-1 shadow-xl">{secondaryItems.map(item => <button key={item.id} onClick={() => { setActiveTab(item.id); setMenuOpen(false); }} className="block w-full rounded px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#303030]">{item.label}</button>)}</div>}
            </div>
            <button aria-label="Open news discovery" onClick={() => setActiveTab('discover')} className="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-slate-300 hover:text-[#ffd429]"><Search className="w-4 h-4" /></button>
            <button className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-slate-200" aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        <nav className="category-nav flex items-center gap-6 overflow-x-auto border-y border-[#444] py-3" aria-label="News sections">
          {['Top Stories', 'World', 'India', 'Politics', 'Business', 'Markets', 'Technology', 'Science', 'Health', 'Sports', 'Environment'].map((label, i) => (
            <button key={label} onClick={() => setActiveTab(i === 0 ? 'dashboard' : 'discover')} className={`whitespace-nowrap text-xs sm:text-sm ${i === 0 && (activeTab === 'dashboard' || activeTab === 'discover') ? 'text-[#ffd429] font-semibold' : 'text-slate-300 hover:text-white'}`}>{label}</button>
          ))}
        </nav>
        {menuOpen && <nav className="md:hidden grid grid-cols-2 gap-2 py-3" aria-label="Main navigation">{[...navItems, ...secondaryItems].map(item => <button key={item.id} onClick={() => { setActiveTab(item.id); setMenuOpen(false); }} className="text-left rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">{item.label}</button>)}</nav>}
      </div>
    </header>
  );
};
