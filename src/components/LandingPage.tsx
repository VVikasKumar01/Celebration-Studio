import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Search, 
  FileText, 
  Users, 
  DollarSign, 
  Calendar, 
  Zap, 
  RotateCcw, 
  Eye,
  SlidersHorizontal,
  CheckSquare,
  GitBranch,
  Store,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Maximize2,
  Compass,
  ArrowUp,
  BrainCircuit,
  Bot,
  Heart,
  GlassWater,
  Music,
  Camera,
  Sun,
  Award
} from 'lucide-react';
import { EventState } from '../types/event';
import { NormanPrinciplesGuide } from './NormanPrinciplesGuide';

interface LandingPageProps {
  currentEvent: EventState;
  eventsList: EventState[];
  onSelectEvent: (eventId: string) => void;
  onLaunchStudio: (targetSection?: string) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

// 3D Perspective Tilt Card with Mouse-Following Spotlight Hover
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -4;
    const rotY = ((x - centerX) / centerX) * 4;

    setRotateX(rotX);
    setRotateY(rotY);
    setSpotlightPos({ x, y });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-xs transition-shadow duration-300 hover:shadow-xl hover:border-stone-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(245, 158, 11, 0.08), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  currentEvent,
  eventsList,
  onSelectEvent,
  onLaunchStudio,
  onRequestAiAssistance,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Interactive Live Preview State
  const [simGuestCount, setSimGuestCount] = useState<number>(currentEvent.guestCount || 120);
  const [simBudgetCeiling, setSimBudgetCeiling] = useState<number>(currentEvent.budgetCeiling || 48000);
  const [simCateringPriority, setSimCateringPriority] = useState<number>(1);
  const [isVenueDepositPaid, setIsVenueDepositPaid] = useState<boolean>(true);
  const [isQuoteUnmasked, setIsQuoteUnmasked] = useState<boolean>(false);
  const [activeTabHighlight, setActiveTabHighlight] = useState<'budget' | 'timeline' | 'forensics'>('budget');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSimGuestCount(currentEvent.guestCount);
    setSimBudgetCeiling(currentEvent.budgetCeiling);
  }, [currentEvent.id]);

  const simCostPerGuest = Math.round(simBudgetCeiling / Math.max(1, simGuestCount));
  const simCateringAllocated = Math.round(simBudgetCeiling * (simCateringPriority === 1 ? 0.38 : 0.25));
  const simCateringPerGuest = Math.round(simCateringAllocated / Math.max(1, simGuestCount));
  const isCateringStressed = simCateringPerGuest < 55;

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Header Navigation — Spacious, Minimalist Luxury */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ease-out ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-3'
          : 'bg-white/95 backdrop-blur-md border-b border-stone-200/60 py-4 sm:py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Brand — Pure Elegance */}
          <button 
            onClick={() => scrollToAnchor('hero')} 
            className="flex items-center gap-2 cursor-pointer group text-left transition-opacity hover:opacity-85"
            aria-label="Celebration Studio Home"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-stone-950">
              Celebration <span className="font-normal italic text-amber-800">Studio</span>
            </span>
          </button>

          {/* Quick Landing Anchor Links — Airy, Unboxed Luxury Spacing */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button 
              onClick={() => scrollToAnchor('hero')} 
              className="hover:text-stone-950 transition-colors cursor-pointer py-1"
            >
              The Vision
            </button>
            <button 
              onClick={() => scrollToAnchor('interactive-sandbox')} 
              className="hover:text-stone-950 transition-colors cursor-pointer py-1 flex items-center gap-1.5 text-stone-800"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Live Experience
            </button>
            <button 
              onClick={() => scrollToAnchor('disciplines')} 
              className="hover:text-stone-950 transition-colors cursor-pointer py-1"
            >
              The 5 Steps
            </button>
            <button 
              onClick={() => scrollToAnchor('norman-principles')} 
              className="hover:text-stone-950 transition-colors cursor-pointer py-1"
            >
              Peace of Mind
            </button>
          </nav>

          {/* Action CTA — Single Refined Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLaunchStudio()}
              className="group px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm font-medium rounded-full shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-24">
        {/* Section A: Hero Stage */}
        <section id="hero" className="scroll-mt-32 pt-4">
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-b from-stone-50/70 via-white to-stone-50/40 p-8 sm:p-14 lg:p-20 shadow-xs">
            {/* Ambient Moving Gradient Orbs */}
            <motion.div
              animate={{
                x: [0, 35, -25, 0],
                y: [0, -45, 25, 0],
                scale: [1, 1.12, 0.95, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200/35 via-rose-100/25 to-transparent blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -35, 30, 0],
                y: [0, 35, -30, 0],
                scale: [0.95, 1.1, 1, 0.95],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-100/30 via-teal-100/20 to-transparent blur-3xl"
            />

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
              {/* Warm Welcome Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-stone-200 shadow-2xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide text-stone-700">
                  Where Pure Joy Meets Effortless Flow
                </span>
              </div>

              {/* Mesmerizing Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.08] text-balance">
                Plan the Celebration You’ve Dreamed of,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-rose-700 to-indigo-800">
                  Without Ever Feeling Overwhelmed.
                </span>
              </h1>

              {/* Heartfelt Lead Paragraph */}
              <p className="text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed text-balance">
                Planning a milestone wedding, birthday, or grand evening should feel like popping champagne, not wrestling with messy spreadsheets. We protect your peace of mind, catch sneaky hidden vendor fees, and guide every detail so your special day unfolds like pure magic.
              </p>

              {/* Celebration Story Switcher */}
              <div className="pt-2 flex flex-col items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Explore Sample Celebration Stories:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {eventsList.map((evt) => {
                    const isActive = evt.id === currentEvent.id;
                    return (
                      <button
                        key={evt.id}
                        onClick={() => onSelectEvent(evt.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                          isActive
                            ? 'bg-stone-900 text-white shadow-md scale-102 ring-2 ring-stone-900/10'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs hover:border-stone-300'
                        }`}
                      >
                        <span>{evt.name.split(' - ')[0] || evt.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isActive ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-600'
                        }`}>
                          ${(evt.budgetCeiling / 1000).toFixed(0)}k
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => onLaunchStudio()}
                  className="group px-7 py-4 bg-stone-900 hover:bg-stone-800 text-white text-sm sm:text-base font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer hover:-translate-y-0.5"
                >
                  <span>Step Inside the Studio</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1.5 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToAnchor('interactive-sandbox')}
                  className="px-6 py-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-sm sm:text-base font-bold rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer hover:border-stone-300 hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Try the Live Magic Preview</span>
                </button>

                <button
                  onClick={() => onRequestAiAssistance('What are the top 3 secrets to hosting a breathtaking party that guests talk about for years?')}
                  className="px-5 py-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-sm sm:text-base font-bold rounded-2xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-amber-600" />
                  <span>Ask Your Personal Planner</span>
                </button>
              </div>

              {/* Clear Guarantees */}
              <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Never Go Over Your Budget
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Seamless Day-Of Schedule
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Transparent, Fair Vendor Quotes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section B: Live Event Dynamics Sandbox */}
        <section id="interactive-sandbox" className="scroll-mt-32 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Interactive Preview
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                See How Effortless Planning Feels
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl mt-1 leading-relaxed">
                Slide the controls below to experience how guest numbers, dinner priorities, and trusted vendors balance together automatically.
              </p>
            </div>

            {/* Sandbox Tabs */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 self-start md:self-auto">
              <button
                onClick={() => setActiveTabHighlight('budget')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTabHighlight === 'budget'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smart Budget Balance</span>
              </button>
              <button
                onClick={() => setActiveTabHighlight('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTabHighlight === 'timeline'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Timing &amp; Peace of Mind</span>
              </button>
              <button
                onClick={() => setActiveTabHighlight('forensics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTabHighlight === 'forensics'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-rose-600" />
                <span>The Honest Quote Check</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            {/* Tab 1: Budget Rebalance Interactive Simulation */}
            {activeTabHighlight === 'budget' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-5 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-600" />
                        Guest List Size
                      </span>
                      <span className="text-sm font-bold text-stone-900 font-mono">
                        {simGuestCount} Loved Ones
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={250}
                      step={5}
                      value={simGuestCount}
                      onChange={(e) => setSimGuestCount(Number(e.target.value))}
                      className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-lg"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Comfortable Budget Cap
                      </span>
                      <span className="text-sm font-bold text-emerald-800 font-mono">
                        ${simBudgetCeiling.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15000}
                      max={90000}
                      step={1000}
                      value={simBudgetCeiling}
                      onChange={(e) => setSimBudgetCeiling(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                    />

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700">Dining &amp; Drinks Focus:</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSimCateringPriority(1)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            simCateringPriority === 1
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white text-stone-600 border border-stone-200'
                          }`}
                        >
                          Star of the Night (38%)
                        </button>
                        <button
                          onClick={() => setSimCateringPriority(3)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            simCateringPriority === 3
                              ? 'bg-stone-800 text-white shadow-2xs'
                              : 'bg-white text-stone-600 border border-stone-200'
                          }`}
                        >
                          Balanced (25%)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <span className="text-xs text-stone-500 font-medium">True Spend Per Guest</span>
                        <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono mt-1">
                          ${simCostPerGuest}
                          <span className="text-xs text-stone-400 font-sans font-normal ml-1">/guest</span>
                        </p>
                      </div>
                      <div className={`p-4 rounded-2xl border transition-colors ${
                        isCateringStressed 
                          ? 'border-rose-300 bg-rose-50/70' 
                          : 'border-emerald-200 bg-emerald-50/50'
                      }`}>
                        <span className="text-xs font-medium text-stone-600">Food &amp; Cocktail Allowance</span>
                        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-1 text-stone-900">
                          ${simCateringPerGuest}
                          <span className="text-xs font-sans font-normal ml-1 text-stone-500">/guest</span>
                        </p>
                      </div>
                    </div>

                    {isCateringStressed && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                        <Heart className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Friendly Advice:</strong> An allowance of ${simCateringPerGuest}/guest for a three-course dinner and bar might limit your choices. We suggest trimming your guest list slightly or shifting a little more love to dining.
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-stone-500 font-medium">
                        <span>How Every Dollar Is Lovingly Allocated</span>
                        <span>100% Protected</span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-100 shadow-inner">
                        <div className="bg-amber-500 transition-all duration-300" style={{ width: `${simCateringPriority === 1 ? '38%' : '25%'}` }} title="Dining & Bar" />
                        <div className="bg-rose-500 transition-all duration-300" style={{ width: '25%' }} title="Dream Venue" />
                        <div className="bg-indigo-500 transition-all duration-300" style={{ width: '15%' }} title="Music & Photography" />
                        <div className="bg-emerald-500 transition-all duration-300" style={{ width: '12%' }} title="Florals & Styling" />
                        <div className="bg-teal-500 transition-all duration-300" style={{ width: `${simCateringPriority === 1 ? '10%' : '23%'}` }} title="Safety Cushion" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Timing & Peace of Mind */}
            {activeTabHighlight === 'timeline' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Step-by-Step Flow Protector
                    </h4>
                    <p className="text-xs text-stone-600">
                      See what happens when key decisions are confirmed in the right order so you never waste money on rushed changes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVenueDepositPaid(!isVenueDepositPaid)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                      isVenueDepositPaid
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {isVenueDepositPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isVenueDepositPaid ? 'Venue Secured with Love' : 'Venue Still Deciding'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isVenueDepositPaid 
                      ? 'border-emerald-300 bg-emerald-50/30' 
                      : 'border-rose-300 bg-rose-50/40 ring-2 ring-rose-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-stone-500">6 Months Ahead</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isVenueDepositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isVenueDepositPaid ? 'Celebration Home Locked' : 'Start Here'}
                      </span>
                    </div>
                    <h5 className="font-bold text-stone-900 text-sm">Lock in Your Dream Venue</h5>
                    <p className="text-xs text-stone-600 mt-1">Once your venue is set, all timing, capacity, and music curfews become crystal clear.</p>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all ${
                    isVenueDepositPaid 
                      ? 'border-stone-200 bg-white' 
                      : 'border-stone-200 bg-stone-50/60 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-stone-500">4 Months Ahead</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                        isVenueDepositPaid ? 'bg-blue-100 text-blue-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {isVenueDepositPaid ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isVenueDepositPaid ? 'Ready to Design' : 'Hold on This Step'}
                      </span>
                    </div>
                    <h5 className="font-bold text-stone-900 text-sm">Design Table Layout &amp; Menu</h5>
                    <p className="text-xs text-stone-600 mt-1">We gently hold this step until you have the exact room measurements in hand.</p>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all ${
                    isVenueDepositPaid 
                      ? 'border-stone-200 bg-white' 
                      : 'border-stone-200 bg-stone-50/60 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-stone-500">2 Months Ahead</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                        isVenueDepositPaid ? 'bg-blue-100 text-blue-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {isVenueDepositPaid ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isVenueDepositPaid ? 'Ready to Mail' : 'Hold on This Step'}
                      </span>
                    </div>
                    <h5 className="font-bold text-stone-900 text-sm">Mail Beautiful Invitations</h5>
                    <p className="text-xs text-stone-600 mt-1">Prevents costly reprints by ensuring meal choices and times are 100% final.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: The Honest Quote Check */}
            {activeTabHighlight === 'forensics' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      The Honest Quote Checker
                    </h4>
                    <p className="text-xs text-stone-600">
                      Uncover sneaky extra charges (+44%) often hidden in fine print before you sign any contract.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsQuoteUnmasked(!isQuoteUnmasked)}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isQuoteUnmasked ? 'Hide Breakdown' : 'Check for Sneaky Extras'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <div className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">What the Vendor Advertised</span>
                    <h4 className="text-lg font-bold text-stone-900">Gourmet Dinner Package</h4>
                    <div className="text-3xl font-extrabold text-stone-900 font-mono">
                      $7,800
                      <span className="text-xs font-sans text-stone-400 font-normal ml-2">Initial Quote</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Looks tempting at $65 a person for 120 guests.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border transition-all duration-500 space-y-3 ${
                    isQuoteUnmasked 
                      ? 'border-rose-300 bg-rose-50/50 ring-2 ring-rose-200 shadow-md' 
                      : 'border-stone-200 bg-stone-50 opacity-70'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                        What You’d Actually Pay Without Us
                      </span>
                      {isQuoteUnmasked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-950 animate-pulse">
                          +$3,442 in Hidden Extras!
                        </span>
                      )}
                    </div>

                    <div className="text-3xl font-extrabold text-stone-900 font-mono">
                      {isQuoteUnmasked ? '$11,242' : '$7,800 + Surprises?'}
                    </div>

                    {isQuoteUnmasked ? (
                      <div className="space-y-1.5 text-xs text-stone-700 pt-1">
                        <div className="flex justify-between border-b border-rose-200/60 pb-1">
                          <span>24% Administrative Service Surcharge</span>
                          <strong className="text-rose-700">+$2,160</strong>
                        </div>
                        <div className="flex justify-between border-b border-rose-200/60 pb-1">
                          <span>Wine Glass &amp; Stemware Rentals</span>
                          <strong className="text-rose-700">+$540</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>State &amp; Local Dining Taxes</span>
                          <strong className="text-rose-700">+$742</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic pt-2">
                        Click "Check for Sneaky Extras" to uncover the unbundled fees hidden in the fine print.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Section C: The 5 Magic Steps */}
        <section id="disciplines" className="scroll-mt-32 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Your Journey
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                The Five Steps to an Unforgettable Event
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl mt-1 leading-relaxed">
                Click any step to step right into your personal planning studio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 01 */}
            <TiltCard onClick={() => onLaunchStudio('discovery')}>
              <div className="p-7 space-y-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <Compass className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-xs font-bold text-stone-400 font-mono">STEP 01</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Your Dream &amp; Atmosphere
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    Tell us your vision, dietary wishes, family traditions, and what matters most. We shape the foundation around your heart.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Vision &amp; Priorities</span>
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    Explore Step 1 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>

            {/* Step 02 */}
            <TiltCard onClick={() => onLaunchStudio('budget')}>
              <div className="p-7 space-y-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-bold text-stone-400 font-mono">STEP 02</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Smart Budget Protection
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    Spend generously where memories are made. Our smart ledger balances every dollar so you never receive an invoice shock.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Clear Finances</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    Explore Step 2 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>

            {/* Step 03 */}
            <TiltCard onClick={() => onLaunchStudio('timeline')}>
              <div className="p-7 space-y-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-800">
                    <CheckSquare className="w-5 h-5 text-indigo-700" />
                  </div>
                  <span className="text-xs font-bold text-stone-400 font-mono">STEP 03</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Effortless Flow &amp; Timeline
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    A calm, graceful countdown from today to the final song. Every milestone unlocks only when you're ready, preventing rush fees.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Day-Of Flow</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    Explore Step 3 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>

            {/* Step 04 */}
            <TiltCard onClick={() => onLaunchStudio('scenarios')}>
              <div className="p-7 space-y-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-800">
                    <GitBranch className="w-5 h-5 text-purple-700" />
                  </div>
                  <span className="text-xs font-bold text-stone-400 font-mono">STEP 04</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Weather &amp; Backup Plans
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    What if 25 more guests RSVP? What if sudden rain hits the garden? Enjoy peace of mind with instant, pre-tested solutions.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Peace of Mind</span>
                  <span className="font-bold text-purple-700 flex items-center gap-1">
                    Explore Step 4 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>

            {/* Step 05 */}
            <TiltCard onClick={() => onLaunchStudio('vendors')}>
              <div className="p-7 space-y-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-800">
                    <Store className="w-5 h-5 text-rose-700" />
                  </div>
                  <span className="text-xs font-bold text-stone-400 font-mono">STEP 05</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Dream Vendors &amp; Honest Quotes
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    Compare caterers, photographers, and venues side-by-side. We uncover every hidden fee so you book with total confidence.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Honest Procurement</span>
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    Explore Step 5 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>

            {/* Norman Card */}
            <TiltCard onClick={() => scrollToAnchor('norman-principles')}>
              <div className="p-7 space-y-4 cursor-pointer bg-gradient-to-br from-stone-900 to-stone-950 text-white border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-stone-800 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-amber-400/80 font-mono">GUARANTEES</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    The 7 Secrets to Calm
                  </h3>
                  <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                    Based on world-renowned human-centered design principles that make planning feel intuitive, reassuring, and completely stress-free.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-stone-800 text-xs">
                  <span className="text-stone-400 font-medium">Why It Works</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    Read the Secrets <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* Section D: Human-Centered Design Secrets */}
        <section id="norman-principles" className="scroll-mt-32">
          <NormanPrinciplesGuide 
            activeSection="introduction" 
            onNavigateSection={(sec) => onLaunchStudio(sec)} 
          />
        </section>

        {/* Section E: Final High-Impact Conversion Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-stone-900 text-white p-8 sm:p-14 shadow-xl">
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Your Dream Day Deserves Perfection
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Plan the Most Beautiful Day of Your Life?
            </h2>
            <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
              Step into your private Celebration Studio. Explore real celebrations or begin shaping your own unforgettable moments right now.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onLaunchStudio()}
                className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 text-base font-black rounded-2xl shadow-lg transition-all duration-200 cursor-pointer hover:scale-103"
              >
                Open Your Celebration Studio →
              </button>
              <button
                onClick={() => onRequestAiAssistance('What are the top 3 secrets to hosting a breathtaking party that guests talk about for years?')}
                className="px-6 py-4 bg-stone-800 hover:bg-stone-700 text-white text-base font-bold rounded-2xl transition cursor-pointer"
              >
                Chat with Your Celebration Planner
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-stone-200 bg-white py-10 mt-16 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-900">EventOS AI</span>
            <span aria-hidden="true">·</span>
            <span>Where Unforgettable Celebrations Come to Life</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => scrollToAnchor('hero')} className="hover:text-stone-900 transition cursor-pointer">Back to Top</button>
            <span aria-hidden="true">·</span>
            <button onClick={() => onLaunchStudio()} className="text-amber-800 font-bold hover:underline cursor-pointer">Step Inside the Studio</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
