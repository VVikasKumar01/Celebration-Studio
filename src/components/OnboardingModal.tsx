import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Users, 
  Layers, 
  HeartHandshake, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { EventState, CategoryKey } from '../types/event';
import { useModalA11y } from '../hooks/useModalA11y';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNewEvent: (newEvent: EventState) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveNewEvent,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Wedding Celebration');
  const [vibe, setVibe] = useState('Warm Rustic Elegance with Candlelight & Acoustic Music');
  const [budgetCeiling, setBudgetCeiling] = useState<number>(30000);
  const [guestCount, setGuestCount] = useState<number>(100);
  const [targetDate, setTargetDate] = useState('2027-06-15');

  // Priority Matrix
  const [priorities, setPriorities] = useState<Record<CategoryKey, number>>({
    catering: 1,
    venue: 2,
    entertainmentMedia: 3,
    decor: 4,
    contingency: 5,
    logisticsStaffing: 6,
  });

  // Special Factors
  const [dietaryText, setDietaryText] = useState('10 Vegetarian, 4 Gluten-Free, 1 Nut Allergy');
  const [ageDemographics, setAgeDemographics] = useState('Adults aged 25-45 with 15% elders (>65)');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('Ramp access to ceremony garden required');
  const [venueRestrictions, setVenueRestrictions] = useState('10 PM outdoor sound curfew; LED candles only');

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsSynthesizing(true);

    const dietaryArray = dietaryText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const total = budgetCeiling;
    const p = priorities;
    let shares: Record<CategoryKey, number> = {
      catering: p.catering === 1 ? 0.38 : 0.30,
      venue: p.venue === 1 ? 0.35 : p.venue === 2 ? 0.28 : 0.22,
      entertainmentMedia: p.entertainmentMedia <= 2 ? 0.18 : 0.12,
      decor: p.decor <= 2 ? 0.16 : 0.10,
      logisticsStaffing: 0.06,
      contingency: 0.06,
    };
    const sumShares = Object.values(shares).reduce((a, b) => a + b, 0);

    const categoriesState: any = {
      venue: {
        key: 'venue',
        label: 'Venue & Grounds',
        allocated: Math.round(total * (shares.venue / sumShares)),
        spent: 0,
        percentage: Math.round((shares.venue / sumShares) * 100),
        rationale: 'Reserved for primary celebration space, tables, and site fees.',
        priorityRank: p.venue,
      },
      catering: {
        key: 'catering',
        label: 'Catering & Craft Bar',
        allocated: Math.round(total * (shares.catering / sumShares)),
        spent: 0,
        percentage: Math.round((shares.catering / sumShares) * 100),
        rationale: 'Food, craft beverage, and waitstaff hospitality experience.',
        priorityRank: p.catering,
      },
      decor: {
        key: 'decor',
        label: 'Florals & Atmospheric Decor',
        allocated: Math.round(total * (shares.decor / sumShares)),
        spent: 0,
        percentage: Math.round((shares.decor / sumShares) * 100),
        rationale: 'Floral centerpieces, atmospheric lighting, and signage.',
        priorityRank: p.decor,
      },
      entertainmentMedia: {
        key: 'entertainmentMedia',
        label: 'Photography, Media & Music',
        allocated: Math.round(total * (shares.entertainmentMedia / sumShares)),
        spent: 0,
        percentage: Math.round((shares.entertainmentMedia / sumShares) * 100),
        rationale: 'Professional documentary photography and music soundtrack.',
        priorityRank: p.entertainmentMedia,
      },
      logisticsStaffing: {
        key: 'logisticsStaffing',
        label: 'Logistics, Rentals & Staffing',
        allocated: Math.round(total * (shares.logisticsStaffing / sumShares)),
        spent: 0,
        percentage: Math.round((shares.logisticsStaffing / sumShares) * 100),
        rationale: 'Day-of coordination, liability insurance, and transport.',
        priorityRank: p.logisticsStaffing,
      },
      contingency: {
        key: 'contingency',
        label: 'Contingency Emergency Reserve',
        allocated: Math.round(total * (shares.contingency / sumShares)),
        spent: 0,
        percentage: Math.round((shares.contingency / sumShares) * 100),
        rationale: 'Emergency buffer against weather tenting or overtime fees.',
        priorityRank: p.contingency,
      },
    };

    const newTasks = [
      {
        id: `t-${Date.now()}-1`,
        title: 'Lock Venue & Contract Signing',
        milestone: 'T-24W' as const,
        dueDate: targetDate,
        category: 'Venue',
        priority: 'critical' as const,
        dependsOn: [],
        actionableNote: 'Mandatory prerequisite for locking caterer tasting and formal invitations.',
        status: 'pending' as const,
      },
      {
        id: `t-${Date.now()}-2`,
        title: 'Finalize Catering Menu & Bar Contract',
        milestone: 'T-16W' as const,
        dueDate: targetDate,
        category: 'Catering',
        priority: 'critical' as const,
        dependsOn: [`t-${Date.now()}-1`],
        actionableNote: 'Blocked until venue and kitchen load-in requirements are signed.',
        status: 'blocked' as const,
      },
      {
        id: `t-${Date.now()}-3`,
        title: 'Send Formal RSVP Invitations with Dietary Form',
        milestone: 'T-8W' as const,
        dueDate: targetDate,
        category: 'Logistics',
        priority: 'high' as const,
        dependsOn: [`t-${Date.now()}-2`],
        actionableNote: 'Blocked until catering menu options are finalized.',
        status: 'blocked' as const,
      },
    ];

    const newEvent: EventState = {
      id: `evt-${Date.now()}`,
      name: name.trim() || 'New Celebration Plan',
      type: type,
      vibe: vibe.trim(),
      targetDate: targetDate,
      guestCount: Number(guestCount),
      budgetCeiling: Number(budgetCeiling),
      priorityMatrix: priorities,
      specialFactors: {
        dietaryNuances: dietaryArray,
        ageDemographics: ageDemographics,
        accessibilityNeeds: accessibilityNeeds,
        venueRestrictions: venueRestrictions,
        culturalTraditions: 'Custom celebratory elements',
      },
      categories: categoriesState,
      budgetItems: [
        {
          id: `item-${Date.now()}-1`,
          category: 'venue',
          name: 'Primary Venue Space Rental',
          type: 'estimated_assumption',
          amount: Math.round(categoriesState.venue.allocated * 0.85),
          status: 'projected',
          notes: 'Estimated venue rental assumption.',
        },
        {
          id: `item-${Date.now()}-2`,
          category: 'catering',
          name: `Food & Bar Service (${guestCount} guests)`,
          type: 'estimated_assumption',
          amount: Math.round(categoriesState.catering.allocated * 0.8),
          status: 'projected',
          notes: `Projected at $${Math.round((categoriesState.catering.allocated * 0.8) / guestCount)}/guest.`,
        },
      ],
      tasks: newTasks,
      vendors: [],
      lastUpdated: new Date().toISOString(),
    };

    setIsSynthesizing(false);
    onSaveNewEvent(newEvent);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-50 text-stone-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 id="onboarding-modal-title" className="text-base font-bold text-stone-900">Celebration Studio • New Plan</h2>
              <p className="text-[11px] text-stone-500 font-medium">Step {step} of 4: Envisioning Your Celebration</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-lg hover:bg-stone-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-amber-600' : 'bg-stone-100'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Occasion & Vibe */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Celebration Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Maya & Leo's Vineyard Wedding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Celebration Type</label>
                <select
                  aria-label="New Event Celebration Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium"
                >
                  <option value="Wedding Celebration">Wedding Celebration</option>
                  <option value="Milestone Birthday">Milestone Birthday (30th, 40th, 50th)</option>
                  <option value="Anniversary Gala">Anniversary Celebration</option>
                  <option value="Corporate Gala & Launch">Corporate Gala &amp; Launch</option>
                  <option value="Private Dinner Party">Private Dinner Party</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Atmosphere, Style &amp; Target Experience</label>
              <textarea
                rows={3}
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="Describe the mood: e.g. Candlelit rustic warmth, craft cocktails, live jazz trio, intimate conversation."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 leading-relaxed focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Budget & Headcount */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              💡 <strong>Gentle Guidance:</strong> Your overall budget and guest count help us balance every experience smoothly so you can enjoy every moment stress-free.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Total Planned Budget ($)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="500"
                  value={budgetCeiling}
                  onChange={(e) => setBudgetCeiling(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-bold focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Expected Guests (Loved Ones &amp; Friends)</label>
              <div className="relative">
                <Users className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-bold focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Planned Investment per Guest:</span>
              <span className="text-base font-black text-emerald-800">
                ${Math.round(budgetCeiling / (guestCount || 1))} / guest
              </span>
            </div>
          </div>
        )}

        {/* Step 3: What Matters Most */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-stone-600">
              What brings you the most joy? Pick your top priorities (Rank #1 is your crown jewel) and we'll ensure they shine brightest.
            </p>

            <div className="space-y-2">
              {(['catering', 'venue', 'entertainmentMedia', 'decor', 'contingency'] as CategoryKey[]).map((key) => {
                const labels: Record<string, string> = {
                  catering: 'Catering & Craft Bar',
                  venue: 'Venue & Grounds',
                  entertainmentMedia: 'Photography & Entertainment',
                  decor: 'Florals & Lighting Decor',
                  contingency: 'Peace of Mind Emergency Buffer',
                };

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-xs font-bold text-stone-900">{labels[key]}</span>
                    <select
                      aria-label={`Priority rank for ${labels[key]}`}
                      value={priorities[key]}
                      onChange={(e) => setPriorities({ ...priorities, [key]: Number(e.target.value) })}
                      className="bg-white border border-stone-300 text-xs text-stone-800 font-bold rounded-xl px-3 py-1"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>Rank #{num}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Special Factors */}
        {step === 4 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Dietary &amp; Allergy Details</label>
              <input
                type="text"
                value={dietaryText}
                onChange={(e) => setDietaryText(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Guest Demographics</label>
              <input
                type="text"
                value={ageDemographics}
                onChange={(e) => setAgeDemographics(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Venue Notes &amp; Curfews</label>
              <input
                type="text"
                value={venueRestrictions}
                onChange={(e) => setVenueRestrictions(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSynthesizing}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{isSynthesizing ? 'Creating your plan...' : 'Create My Celebration Plan ✨'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
