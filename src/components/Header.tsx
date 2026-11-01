import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  CheckSquare, 
  GitBranch, 
  Store, 
  Bot, 
  Download, 
  Plus, 
  ChevronDown,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { EventState } from '../types/event';

interface HeaderProps {
  currentEvent: EventState;
  eventsList: EventState[];
  onSelectEvent: (eventId: string) => void;
  onNewEvent: () => void;
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  onExportDossier: () => void;
  onBackToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEvent,
  eventsList,
  onSelectEvent,
  onNewEvent,
  activeSection,
  onNavigateSection,
  isAiDrawerOpen,
  setIsAiDrawerOpen,
  onExportDossier,
  onBackToLanding,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'discovery', label: 'Vision & Atmosphere', icon: Compass },
    { id: 'budget', label: 'Smart Budget', icon: SlidersHorizontal },
    { id: 'timeline', label: 'Flow & Timeline', icon: CheckSquare },
    { id: 'scenarios', label: 'Peace-of-Mind Backups', icon: GitBranch },
    { id: 'vendors', label: 'Vendors & Quotes', icon: Store },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ease-out bg-white/95 backdrop-blur-md border-b border-stone-200/80 ${
      isScrolled ? 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]' : ''
    }`}>
      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4 border-b border-stone-100">
          {/* Brand & Return Link */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onBackToLanding ? onBackToLanding() : onNavigateSection('discovery')}
              className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-950 hover:opacity-85 transition cursor-pointer text-left"
              title="Celebration Studio"
            >
              Celebration <span className="font-normal italic text-amber-800">Studio</span>
            </button>

            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors py-1 px-2.5 rounded-full hover:bg-stone-100 cursor-pointer"
                title="Return to the introduction page"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
            )}
          </div>

          {/* Event Switcher & Primary Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Event Switcher */}
            <div className="relative">
              <select
                aria-label="Active Celebration"
                value={currentEvent.id}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="appearance-none bg-stone-50 hover:bg-stone-100/80 border border-stone-200 text-stone-800 font-medium text-xs sm:text-sm pl-3 pr-8 py-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-400 max-w-[150px] sm:max-w-[220px] truncate"
              >
                {eventsList.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* New Celebration Button */}
            <button
              onClick={onNewEvent}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 py-2 px-3 rounded-lg transition cursor-pointer"
              title="Create a new celebration plan"
            >
              <Plus className="w-3.5 h-3.5 text-stone-500" />
              <span>New Plan</span>
            </button>

            {/* Export Dossier */}
            <button
              onClick={onExportDossier}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 py-2 px-3 rounded-lg transition cursor-pointer"
              title="Download full celebration plan"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* AI Assistant Drawer Trigger */}
            <button
              onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              className={`flex items-center gap-2 text-xs font-medium py-2 px-3.5 rounded-lg transition cursor-pointer ${
                isAiDrawerOpen
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-900 hover:bg-stone-850 text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Sarah (AI)</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>

        {/* Studio Section Tabs — Light, Open, Minimalist */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 text-xs sm:text-sm font-medium">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateSection(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                <span>
                  <span className="opacity-60 mr-1 text-[11px] font-sans">{idx + 1}.</span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
