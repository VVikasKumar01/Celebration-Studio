import React, { useState } from 'react';
import { 
  Eye, 
  RotateCcw, 
  HandMetal, 
  Sparkles, 
  Compass, 
  ShieldAlert, 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface NormanPrinciple {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  accentBg: string;
  definition: string;
  implementation: string;
  hotspots: string[];
}

const NORMAN_PRINCIPLES: NormanPrinciple[] = [
  {
    id: 'visibility',
    name: '1. Crystal-Clear Visibility',
    subtitle: 'Always know where you stand, with zero guesswork',
    icon: Eye,
    color: 'text-amber-700',
    accentBg: 'bg-amber-50 border-amber-200',
    definition: 'When every detail is openly visible, your mind stays calm, confident, and joyful.',
    implementation: 'Your top overview shows exact countdown weeks, your locked budget ceiling, and what steps are awaiting attention. Signed vendor contracts are clearly distinguished from estimated plans.',
    hotspots: ['Top Overview Strip', 'Signed Contracts vs Working Plans', 'Remaining To-Do Countdown']
  },
  {
    id: 'feedback',
    name: '2. Instant Reassurance',
    subtitle: 'Every adjustment yields immediate, clear answers',
    icon: RotateCcw,
    color: 'text-emerald-700',
    accentBg: 'bg-emerald-50 border-emerald-200',
    definition: 'Whenever you make a choice, you immediately see the outcome so you never second-guess yourself.',
    implementation: 'Slide your guest count and instantly see the spend per guest update. Rebalance your dinner budget and watch all other categories adjust gracefully without breaking your budget.',
    hotspots: ['Live Spend per Guest', 'Instant Budget Preview', 'Gentle Step Confirmations']
  },
  {
    id: 'affordance',
    name: '3. Natural Touch & Feel',
    subtitle: 'Designed to feel instinctive, tactile, and smooth',
    icon: HandMetal,
    color: 'text-indigo-700',
    accentBg: 'bg-indigo-50 border-indigo-200',
    definition: 'Controls invite your touch naturally, making event planning feel like an elegant creative notebook.',
    implementation: 'Smooth sliders, beautifully elevated cards with responsive hover spotlights, and tactile buttons that give satisfying confirmation.',
    hotspots: ['Bespoke Preset Chips', 'Elevated Touch Buttons', 'Interactive Status Switches']
  },
  {
    id: 'signifiers',
    name: '4. Gentle Guidance',
    subtitle: 'Clear visual cues showing what to focus on next',
    icon: Sparkles,
    color: 'text-purple-700',
    accentBg: 'bg-purple-50 border-purple-200',
    definition: 'Helpful clues gently guide your eyes so you always know the next right step.',
    implementation: 'Clear icons show when a task is waiting for a previous booking, priority badges rank your must-haves, and fee alerts highlight fine print.',
    hotspots: ['Prerequisite Indicators', 'Priority Badges (#1 to #5)', 'Hidden Fee Warnings']
  },
  {
    id: 'mapping',
    name: '5. Harmonious Flow',
    subtitle: 'A timeline that unfolds in natural chronological rhythm',
    icon: Compass,
    color: 'text-teal-700',
    accentBg: 'bg-teal-50 border-teal-200',
    definition: 'Controls move in the exact sequence of your real-world celebration story.',
    implementation: 'Your timeline flows gracefully from 6 months out down to the day-of entrance. Your #1 priorities are honored first in your plans.',
    hotspots: ['Chronological Flow', 'Proportional Budget Harmony', 'Side-by-Side Comparisons']
  },
  {
    id: 'constraints',
    name: '6. Loving Guardrails',
    subtitle: 'Protecting your budget before any surprise can happen',
    icon: ShieldAlert,
    color: 'text-rose-700',
    accentBg: 'bg-rose-50 border-rose-200',
    definition: 'Gentle safety boundaries that stop errors and surprise costs before they ever happen.',
    implementation: 'Protects you from accidentally exceeding your budget ceiling, reserves a dedicated emergency cushion, and holds invitations until menu choices are locked.',
    hotspots: ['Step-by-Step Flow Protection', 'Budget Ceiling Safeguards', 'Peace-of-Mind Cushion']
  },
  {
    id: 'conceptual_model',
    name: '7. Total Peace of Mind',
    subtitle: 'A calm, unified roadmap for your dream day',
    icon: BrainCircuit,
    color: 'text-stone-900',
    accentBg: 'bg-stone-100 border-stone-300',
    definition: 'A clear picture of how every moving piece harmonizes into one breathtaking celebration.',
    implementation: 'Five simple, beautiful steps: Vision & Vibe → Smart Budget → Day-Of Flow → Backup Plans → Honest Quotes. Nothing forgotten, nothing left to chance.',
    hotspots: ['Five-Step Journey', 'Weather Backup Solutions', 'Honest Quote Comparisons']
  }
];

interface NormanPrinciplesGuideProps {
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
}

export const NormanPrinciplesGuide: React.FC<NormanPrinciplesGuideProps> = ({
  activeSection,
  onNavigateSection,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>('conceptual_model');

  const active = NORMAN_PRINCIPLES.find(p => p.id === selectedPrinciple) || NORMAN_PRINCIPLES[0];

  return (
    <div id="norman-principles" className="scroll-mt-28 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                The Seven Secrets to an Effortless Celebration
              </h2>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 rounded-md">
                Guaranteed Calm
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Clear Visibility · Instant Reassurance · Natural Touch · Gentle Guidance · Harmonious Flow · Loving Guardrails · Total Peace of Mind
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="norman-principles-content"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <span>{isOpen ? 'Close Secrets Guide' : 'Discover the 7 Secrets'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-stone-600" /> : <ChevronDown className="w-4 h-4 text-stone-600" />}
        </button>
      </div>

      {isOpen && (
        <div id="norman-principles-content" className="mt-6 pt-6 border-t border-stone-100 space-y-6">
          {/* Principles Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {NORMAN_PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              const isSelected = selectedPrinciple === principle.id;
              return (
                <button
                  key={principle.id}
                  onClick={() => setSelectedPrinciple(principle.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    isSelected
                      ? `${principle.accentBg} ${principle.color} shadow-2xs font-bold`
                      : 'bg-stone-50 text-stone-600 border-stone-200/70 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{principle.name}</span>
                </button>
              );
            })}
          </div>

          {/* Principle Deep Dive Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-stone-50/70 border border-stone-200/90 rounded-2xl p-5 sm:p-6">
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${active.accentBg} ${active.color}`}>
                  Don Norman Law
                </span>
                <span className="text-xs font-bold text-stone-900">{active.subtitle}</span>
              </div>
              <blockquote className="text-xs sm:text-sm text-stone-700 italic border-l-2 border-stone-300 pl-3 leading-relaxed">
                "{active.definition}"
              </blockquote>
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">How EventOS Implements This</span>
                <p className="text-xs text-stone-800 leading-relaxed mt-1 font-medium">
                  {active.implementation}
                </p>
              </div>
            </div>

            <div className="md:col-span-6 space-y-3 bg-white border border-stone-200/80 rounded-xl p-4 sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Living Interface Touchpoints</span>
              </span>
              <ul className="space-y-2 text-xs text-stone-600">
                {active.hotspots.map((spot, i) => (
                  <li key={i} className="flex items-start gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="font-medium text-stone-800">{spot}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
