import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  HeartHandshake,
  Compass,
  Sliders,
  Check,
  Info
} from 'lucide-react';
import { EventState, CategoryKey } from '../types/event';
import { SectionQuickActions } from './SectionQuickActions';
import { IMAGES } from '../assets/images';

interface DiscoveryWorkflowProps {
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  onNavigateSection: (sectionId: string) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

export const DiscoveryWorkflow: React.FC<DiscoveryWorkflowProps> = ({
  currentEvent,
  onUpdateEvent,
  onNavigateSection,
  onRequestAiAssistance,
}) => {
  const [formData, setFormData] = useState<EventState>(currentEvent);
  const [newDietaryTag, setNewDietaryTag] = useState('');
  const [showAllocationSuccess, setShowAllocationSuccess] = useState(false);

  // Sync formData when currentEvent changes
  React.useEffect(() => {
    setFormData(currentEvent);
  }, [currentEvent.id]);

  const handlePriorityChange = (category: CategoryKey, newRank: number) => {
    const updatedPriorities = { ...formData.priorityMatrix, [category]: newRank };
    setFormData({ ...formData, priorityMatrix: updatedPriorities });
  };

  const handleAddDietaryTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDietaryTag.trim()) return;
    const currentTags = formData.specialFactors.dietaryNuances || [];
    if (!currentTags.includes(newDietaryTag.trim())) {
      const updated = {
        ...formData,
        specialFactors: {
          ...formData.specialFactors,
          dietaryNuances: [...currentTags, newDietaryTag.trim()],
        },
      };
      setFormData(updated);
      onUpdateEvent(updated);
    }
    setNewDietaryTag('');
  };

  const handleRemoveDietaryTag = (tag: string) => {
    const updated = {
      ...formData,
      specialFactors: {
        ...formData.specialFactors,
        dietaryNuances: formData.specialFactors.dietaryNuances.filter(t => t !== tag),
      },
    };
    setFormData(updated);
    onUpdateEvent(updated);
  };

  // Human UI/UX Allocation Generator based on user priorities & constraints
  const handleGeneratePriorityAllocation = () => {
    const total = formData.budgetCeiling;
    const p = formData.priorityMatrix;
    const guests = formData.guestCount || 1;

    const rankWeights: Record<number, number> = {
      1: 0.38,
      2: 0.26,
      3: 0.15,
      4: 0.09,
      5: 0.06,
      6: 0.06,
    };

    let rawShares: Record<CategoryKey, number> = {
      catering: rankWeights[p.catering || 1] || 0.35,
      venue: rankWeights[p.venue || 2] || 0.25,
      entertainmentMedia: rankWeights[p.entertainmentMedia || 3] || 0.15,
      decor: rankWeights[p.decor || 4] || 0.10,
      logisticsStaffing: 0.05,
      contingency: 0.05,
    };

    const sumShares = Object.values(rawShares).reduce((a, b) => a + b, 0);
    const updatedCategories = { ...formData.categories };

    const priorityExplanations: Record<CategoryKey, string> = {
      catering: `Ranked #${p.catering} priority. Reserved $${Math.round((rawShares.catering / sumShares) * total).toLocaleString()} (~$${Math.round(((rawShares.catering / sumShares) * total) / guests)}/guest) for food, beverage hospitality, and banquet staff.`,
      venue: `Ranked #${p.venue} priority. Dedicated $${Math.round((rawShares.venue / sumShares) * total).toLocaleString()} for primary celebration space, furniture rentals, and site fees.`,
      entertainmentMedia: `Ranked #${p.entertainmentMedia} priority. Dedicated $${Math.round((rawShares.entertainmentMedia / sumShares) * total).toLocaleString()} for documentary photography and audio entertainment.`,
      decor: `Ranked #${p.decor} priority. Dedicated $${Math.round((rawShares.decor / sumShares) * total).toLocaleString()} for floral installations, tablescapes, and ambient lighting.`,
      logisticsStaffing: `Essential operational baseline ($${Math.round((rawShares.logisticsStaffing / sumShares) * total).toLocaleString()}) for day-of coordination and permits.`,
      contingency: `Mandatory emergency reserve ($${Math.round((rawShares.contingency / sumShares) * total).toLocaleString()}) to protect against overtime or weather shocks.`,
    };

    Object.keys(rawShares).forEach((k) => {
      const catKey = k as CategoryKey;
      const normalizedPercent = Math.round((rawShares[catKey] / sumShares) * 100);
      const allocatedDollars = Math.round(total * (normalizedPercent / 100));

      if (updatedCategories[catKey]) {
        updatedCategories[catKey] = {
          ...updatedCategories[catKey],
          allocated: allocatedDollars,
          percentage: normalizedPercent,
          rationale: priorityExplanations[catKey],
          priorityRank: p[catKey] || 3,
        };
      }
    });

    const updatedEvent: EventState = {
      ...formData,
      categories: updatedCategories,
      lastUpdated: new Date().toISOString(),
    };

    setFormData(updatedEvent);
    onUpdateEvent(updatedEvent);
    setShowAllocationSuccess(true);
    setTimeout(() => setShowAllocationSuccess(false), 5000);
  };

  const perGuestCost = Math.round(formData.budgetCeiling / (formData.guestCount || 1));

  const priorityLabels: Record<CategoryKey, { title: string; subtitle: string }> = {
    catering: { title: 'Catering & Craft Bar', subtitle: 'Food, craft bar, service staff, cocktail canapés' },
    venue: { title: 'Venue & Grounds', subtitle: 'Site buyout, setup access, ceremony & dining spaces' },
    entertainmentMedia: { title: 'Photography & Entertainment', subtitle: 'Documentary storyteller, sound rig, live music or DJ' },
    decor: { title: 'Decor & Florals', subtitle: 'Tablescapes, bouquets, floral arch, candle illumination' },
    logisticsStaffing: { title: 'Logistics & Coordination', subtitle: 'Day-of coordinator, event insurance, shuttles' },
    contingency: { title: 'Emergency Contingency', subtitle: '5-8% safety buffer for weather or unexpected overtime' },
  };

  return (
    <section id="discovery" className="scroll-mt-32 space-y-10">
      {/* Editorial Hero Split Banner */}
      <div className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Headline, Narrative & AI Prompt Trigger */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span>Step 1</span>
                  <span aria-hidden="true">·</span>
                  <span>Your Vision &amp; Atmosphere</span>
                  <span aria-hidden="true">·</span>
                  <span>Celebration Studio</span>
                </div>
                <SectionQuickActions
                  sectionType="discovery"
                  sectionTitle="Vision"
                  currentEvent={formData}
                  onUpdateEvent={onUpdateEvent}
                />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-[1.1] max-w-xl text-balance">
                {formData.name}
              </h2>

              <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                Every truly unforgettable celebration begins with what moves your heart. We take your dream guest count, preferred season, and personal wishes, weaving them into a joyful, stress-free plan where every detail shines.
              </p>

              {/* Coordinator Endorsement Box */}
              <div className="flex items-center gap-3.5 pt-2">
                <img
                  src={IMAGES.avatarCoordinator}
                  alt="EventOS Lead Coordinator"
                  className="w-11 h-11 rounded-full object-cover border border-stone-200 shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Sarah Jenkins</p>
                  <p className="text-stone-500">Lead Celebration Concierge · Ready to help your dream day unfold</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => onRequestAiAssistance(`As my Celebration Advisor, ask me targeted questions to discover the core vision for my event: total budget, target date, and expected guest count. Then, use this information to create a balanced budget.`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Chat with Sarah</span>
              </button>

              <button
                onClick={() => onNavigateSection('budget')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 transition cursor-pointer"
              >
                <span>Explore Budget Balance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: High-Fidelity Editorial Imagery */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden bg-stone-100">
            <img
              src={IMAGES.hero}
              alt="Celebration dinner table in glasshouse conservatory"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xs font-medium text-amber-300 uppercase tracking-wider">Atmospheric Vision</p>
              <p className="text-sm font-semibold text-stone-100 italic mt-0.5 max-w-sm">
                "{formData.vibe}"
              </p>
            </div>
          </div>
        </div>

        {/* Full-width 4-Column KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-stone-50/70 border-t border-stone-200/80">
          <div>
            <span className="text-xs font-medium text-stone-500">Planned Budget</span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 tabular-nums">
              ${formData.budgetCeiling.toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-500">Total investment comfort</span>
          </div>

          <div>
            <span className="text-xs font-medium text-stone-500">Expected Guests</span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 tabular-nums">
              {formData.guestCount} Loved Ones
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold tabular-nums">${perGuestCost} / guest investment</span>
          </div>

          <div>
            <span className="text-xs font-medium text-stone-500">Target Celebration Date</span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1 font-mono">
              {formData.targetDate}
            </div>
            <span className="text-[11px] text-stone-500">Your special date</span>
          </div>

          <div>
            <span className="text-xs font-medium text-stone-500">Cherished Priority #1</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1 capitalize truncate">
              {Object.entries(formData.priorityMatrix).find(([_, r]) => r === 1)?.[0] || 'Catering'}
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">Always protected &amp; prioritized</span>
          </div>
        </div>
      </div>

      {/* Interactive Core Constraint Intake & Element Prioritization Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Targeted Questions Intake (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">1. Envision Your Special Day</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Share what you envision, and watch your celebration take shape with grace and clarity.
              </p>
            </div>

            {/* Q1: Celebration Occasion & Vibe */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Celebration Occasion Title
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const updated = { ...formData, name: e.target.value };
                  setFormData(updated);
                  onUpdateEvent(updated);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="e.g. Maya & Leo's Golden Garden Wedding"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Atmosphere &amp; Vibe Description
              </label>
              <textarea
                rows={2}
                value={formData.vibe}
                onChange={(e) => {
                  const updated = { ...formData, vibe: e.target.value };
                  setFormData(updated);
                  onUpdateEvent(updated);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="e.g. Warm Rustic Elegance with Candlelight, Live Jazz & Sustainable Florals"
              />
            </div>

            {/* Q2: Hard Budget Ceiling */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Total Planned Budget ($)
                </label>
                <span className="text-xs font-black text-emerald-800 tabular-nums">
                  ${formData.budgetCeiling.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                step="500"
                value={formData.budgetCeiling}
                onChange={(e) => {
                  const updated = { ...formData, budgetCeiling: Number(e.target.value) };
                  setFormData(updated);
                  onUpdateEvent(updated);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 font-bold tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10000, 25000, 36000, 50000, 75000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, budgetCeiling: preset };
                      setFormData(updated);
                      onUpdateEvent(updated);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition cursor-pointer tabular-nums ${
                      formData.budgetCeiling === preset
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3 & Q4: Headcount and Target Date */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Expected Loved Ones
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => {
                    const updated = { ...formData, guestCount: Number(e.target.value) };
                    setFormData(updated);
                    onUpdateEvent(updated);
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 font-semibold tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <span className={`text-[11px] block tabular-nums font-semibold ${
                  perGuestCost < 65 ? 'text-rose-600' : 'text-stone-500'
                }`}>
                  =${perGuestCost} / guest investment
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Celebration Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => {
                    const updated = { ...formData, targetDate: e.target.value };
                    setFormData(updated);
                    onUpdateEvent(updated);
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Thoughtful Planning Tip: Per-Guest Experience */}
            {perGuestCost < 65 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Gentle Planning Insight:</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    At ${perGuestCost} per guest, dining &amp; drinks will naturally be the main focus of your celebration. Consider planning around ${Math.round(formData.guestCount * 120).toLocaleString()} or inviting ~${Math.round(formData.budgetCeiling / 120)} loved ones to give you the most luxurious dining experience.
                  </p>
                </div>
              </div>
            )}

            {/* Special Nuances Chips */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Dietary &amp; Special Touches
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700">
                {(formData.specialFactors.dietaryNuances || []).map((tag, idx) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 py-0.5">
                    <span className="font-medium text-stone-800">{tag}</span>
                    <button
                      onClick={() => handleRemoveDietaryTag(tag)}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                    {idx < (formData.specialFactors.dietaryNuances.length - 1) && (
                      <span className="text-stone-300 ml-1" aria-hidden="true">·</span>
                    )}
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddDietaryTag} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. 15 Vegan, 8 Gluten-Free, Nut Allergy"
                  value={newDietaryTag}
                  onChange={(e) => setNewDietaryTag(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Element Prioritization & Suggested Budget Allocation (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  2. Prioritize What You Love Most
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Rank what matters most from 1 (Most Cherished) to 5. We'll balance your budget so your favorite experiences shine brightest.
                </p>
              </div>

              <button
                onClick={handleGeneratePriorityAllocation}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Balance My Budget ✨</span>
              </button>
            </div>

            {/* Success toast if updated */}
            {showAllocationSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Initial budget allocations updated successfully to reflect your priorities!</span>
                </div>
                <button onClick={() => setShowAllocationSuccess(false)} className="text-emerald-700 font-bold ml-2 cursor-pointer">✕</button>
              </div>
            )}

            {/* Natural Mapping Spectrum Bar */}
            <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Natural Mapping: Budget Proportional Split</span>
                </span>
                <span className="text-stone-500 font-normal">100% Balanced</span>
              </div>
              <div className="h-3 w-full rounded-full bg-stone-200 overflow-hidden flex">
                {(['catering', 'venue', 'entertainmentMedia', 'decor', 'contingency'] as CategoryKey[]).map((k) => {
                  const cat = formData.categories[k];
                  const colors: Record<CategoryKey, string> = {
                    catering: 'bg-amber-500',
                    venue: 'bg-stone-700',
                    entertainmentMedia: 'bg-indigo-600',
                    decor: 'bg-rose-500',
                    logisticsStaffing: 'bg-teal-600',
                    contingency: 'bg-emerald-600',
                  };
                  return (
                    <div
                      key={k}
                      title={`${priorityLabels[k].title}: ${cat?.percentage || 0}% ($${cat?.allocated.toLocaleString() || 0})`}
                      className={`${colors[k]} h-full transition-all duration-300`}
                      style={{ width: `${cat?.percentage || 0}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-600 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Catering</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-700" /> Venue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Media &amp; DJ</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Decor</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Contingency</span>
              </div>
            </div>

            {/* Prioritization List with Clear Signifiers & Direct Affordances */}
            <div className="space-y-3">
              {(['catering', 'venue', 'entertainmentMedia', 'decor', 'contingency'] as CategoryKey[]).map((key) => {
                const info = priorityLabels[key];
                const currentRank = formData.priorityMatrix[key] || 3;
                const catData = formData.categories[key];

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition-all ${
                      currentRank === 1 
                        ? 'bg-amber-50/50 border-amber-300/80 shadow-2xs' 
                        : 'bg-stone-50 border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-stone-400 font-mono text-xs select-none">⋮⋮</span>
                          <h4 className="text-sm font-bold text-stone-900">{info.title}</h4>
                          <span aria-hidden="true" className="text-stone-300">·</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            currentRank === 1 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : currentRank === 2
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}>
                            Rank #{currentRank} {currentRank === 1 ? '• Top Protected' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed pl-5">{info.subtitle}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                        <div className="text-right">
                          <span className="text-xs font-black text-stone-900 tabular-nums">
                            ${catData?.allocated.toLocaleString() || 0}
                          </span>
                          <span className="text-[11px] text-stone-500 block tabular-nums">
                            ({catData?.percentage || 0}%)
                          </span>
                        </div>

                        {/* Norman Direct Affordance: Explicit Rank Selector Chips */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handlePriorityChange(key, num)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                currentRank === num
                                  ? 'bg-stone-900 text-white shadow-2xs'
                                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                              }`}
                              title={`Set priority rank #${num} for ${info.title}`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Strategic Rationale Box */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-1.5 text-stone-800 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Priority Allocation Rationale</span>
              </div>
              <p>
                Based on your preferences, <strong>{priorityLabels[Object.entries(formData.priorityMatrix).find(([_, r]) => r === 1)?.[0] as CategoryKey || 'catering']?.title}</strong> is prioritized as Rank #1, commanding ~38% of total capital. Lower ranks are adjusted proportionally to protect your primary guest experience without overspending.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
