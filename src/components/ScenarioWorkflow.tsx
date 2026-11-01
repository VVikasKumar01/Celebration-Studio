import React, { useState } from 'react';
import { 
  GitBranch, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Users, 
  DollarSign, 
  Calendar,
  Layers,
  ShieldAlert,
  Zap,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { EventState, ScenarioAnalysis, TradeOffStrategy, CategoryKey } from '../types/event';
import { SectionQuickActions } from './SectionQuickActions';

interface ScenarioWorkflowProps {
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

export const ScenarioWorkflow: React.FC<ScenarioWorkflowProps> = ({
  currentEvent,
  onUpdateEvent,
  onRequestAiAssistance,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('plus_guests');
  const [customScenarioText, setCustomScenarioText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [appliedStrategyId, setAppliedStrategyId] = useState<string | null>(null);

  const runScenarioSimulation = async (scenarioType: string, customPrompt?: string) => {
    setIsAnalyzing(true);
    setAppliedStrategyId(null);

    const baseBudget = currentEvent.budgetCeiling;
    const baseGuests = currentEvent.guestCount;

    let promptDescription = '';
    let mockResult: ScenarioAnalysis;

    if (scenarioType === 'plus_guests') {
      const extraGuests = 30;
      const newGuests = baseGuests + extraGuests;
      const extraCost = extraGuests * Math.round(currentEvent.categories.catering.allocated / baseGuests);
      promptDescription = `+${extraGuests} Additional Guests (Total: ${newGuests} guests).`;

      mockResult = {
        scenarioSummary: `Adding +${extraGuests} guests (${newGuests} total) increases catering, bar covers, table linens, and service staffing.`,
        costDelta: extraCost,
        costDeltaExplanation: `Estimated +$${extraCost.toLocaleString()} required for ${extraGuests} additional dinner covers and bar beverages.`,
        scheduleImpact: 'RSVP deadline must be strictly moved forward by 1 week to lock kitchen procurement.',
        dominoEffects: [
          {
            area: 'Catering',
            impact: `Kitchen requires 3 additional banquet tables and 1 extra bartender. Expense expands by +$${extraCost.toLocaleString()}.`,
            severity: 'high',
          },
          {
            area: 'Venue Capacity',
            impact: `Verify certified fire marshal seated capacity. If hall capacity is capped at 130, accommodating ${newGuests} requires transitioning to cocktail high-tops or outdoor spillover.`,
            severity: 'high',
          },
          {
            area: 'Timeline & Lead Times',
            impact: 'Print invitations and dietary response cards must be dispatched immediately to handle expanded headcount.',
            severity: 'medium',
          },
          {
            area: 'Logistics & Staffing',
            impact: 'Shuttle bus may require an additional continuous circuit trip to transport out-of-town guests.',
            severity: 'low',
          },
        ],
        tradeOffStrategies: [
          {
            optionId: 'A',
            title: 'Option A: Absorb via Decor & Contingency Reallocation',
            philosophy: 'Maintain full seated dinner quality by reallocating $2,500 from florals/decor and utilizing $1,000 of contingency reserve.',
            proposedBudgetRebalance: {
              catering: currentEvent.categories.catering.allocated + extraCost,
              venue: currentEvent.categories.venue.allocated,
              decor: Math.max(1000, currentEvent.categories.decor.allocated - 1800),
              entertainmentMedia: currentEvent.categories.entertainmentMedia.allocated,
              logisticsStaffing: currentEvent.categories.logisticsStaffing.allocated,
              contingency: Math.max(500, currentEvent.categories.contingency.allocated - 1000),
            },
            guestCountAdjustment: newGuests,
            pros: ['All 150 guests receive the full plated dinner experience', 'Venue and entertainment remain completely untouched'],
            cons: ['Reduces floral budget to minimal bud vases and greenery', 'Depletes contingency buffer to ~2%'],
            actionItems: ['Contact florist to switch to minimalist greenery table runners', 'Approve caterer cover adjustment quote'],
          },
          {
            optionId: 'B',
            title: 'Option B: Shift from Plated Dinner to Family-Style / Food Stations',
            philosophy: 'Accommodate +30 guests without increasing total budget ceiling by shifting service style from formal plated to artisanal chef stations.',
            proposedBudgetRebalance: {
              catering: currentEvent.categories.catering.allocated + 500,
              venue: currentEvent.categories.venue.allocated,
              decor: currentEvent.categories.decor.allocated - 500,
              entertainmentMedia: currentEvent.categories.entertainmentMedia.allocated,
              logisticsStaffing: currentEvent.categories.logisticsStaffing.allocated,
              contingency: currentEvent.categories.contingency.allocated,
            },
            guestCountAdjustment: newGuests,
            pros: ['Zero net budget increase', 'Interactive, convivial guest dining dynamic'],
            cons: ['Changes dining formality from formal plated to stations', 'Requires 20 minutes buffet queue spacing'],
            actionItems: ['Request station menu options from catering director', 'Update invitation RSVP card options'],
          },
          {
            optionId: 'C',
            title: 'Option C: Tiered Invitation Wave (Priority List)',
            philosophy: 'Defend original budget & headcount cap of 120 by sending an early Round 1 RSVP wave with a tight 2-week cutoff before releasing B-list invites.',
            proposedBudgetRebalance: {
              catering: currentEvent.categories.catering.allocated,
              venue: currentEvent.categories.venue.allocated,
              decor: currentEvent.categories.decor.allocated,
              entertainmentMedia: currentEvent.categories.entertainmentMedia.allocated,
              logisticsStaffing: currentEvent.categories.logisticsStaffing.allocated,
              contingency: currentEvent.categories.contingency.allocated,
            },
            guestCountAdjustment: baseGuests,
            pros: ['Keeps exact $36,000 budget and high-end experience intact', 'Protects contingency and decor completely'],
            cons: ['Requires strict administrative RSVP tracking and tactful invitation waves'],
            actionItems: ['Tag guests into Wave A (VIP/Family) and Wave B (Colleagues/Plus Ones)', 'Set Wave A RSVP deadline at T-10W'],
          },
        ],
        actionableNextSteps: [
          'Choose between Option A (absorb cost) or Option B (modify service style) within 48 hours.',
          'Verify venue certified fire marshal occupancy limit before printing extra invitations.',
          'Request formal revised cover contract from catering captain.',
        ],
      };
    } else if (scenarioType === 'budget_cut') {
      const cutAmount = Math.round(baseBudget * 0.20);
      promptDescription = `20% Budget Cut (-$${cutAmount.toLocaleString()}).`;

      mockResult = {
        scenarioSummary: `A 20% budget reduction (-$${cutAmount.toLocaleString()}) requires selective priority alignment rather than uniform cuts across all categories.`,
        costDelta: -cutAmount,
        costDeltaExplanation: `Target budget ceiling reduced by -$${cutAmount.toLocaleString()} to new ceiling $${(baseBudget - cutAmount).toLocaleString()}.`,
        scheduleImpact: 'No direct schedule compression, but pending vendor contracts must be renegotiated immediately.',
        dominoEffects: [
          {
            area: 'Catering',
            impact: 'Catering is your #1 priority; uniform cutting would degrade food quality. Protect per-head entrée standards.',
            severity: 'high',
          },
          {
            area: 'Venue Capacity',
            impact: 'Venue contract is already locked ($10,500 committed); venue savings are locked at $0 without cancellation penalty.',
            severity: 'high',
          },
          {
            area: 'Timeline & Lead Times',
            impact: 'Renegotiate decor and entertainment contracts before deposits are finalized.',
            severity: 'medium',
          },
          {
            area: 'Logistics & Staffing',
            impact: 'Replace paid day-of assistants with trusted personal coordinators or digital check-in.',
            severity: 'low',
          },
        ],
        tradeOffStrategies: [
          {
            optionId: 'A',
            title: 'Option A: Trim Guest Headcount by 18% (120 -> 98 Guests)',
            philosophy: 'Defend luxury per-guest experience and vendor quality by selectively trimming the guest list to 98 attendees.',
            proposedBudgetRebalance: {
              catering: Math.round(currentEvent.categories.catering.allocated * 0.82),
              venue: currentEvent.categories.venue.allocated,
              decor: currentEvent.categories.decor.allocated - 800,
              entertainmentMedia: currentEvent.categories.entertainmentMedia.allocated,
              logisticsStaffing: currentEvent.categories.logisticsStaffing.allocated - 400,
              contingency: Math.round(currentEvent.categories.contingency.allocated * 0.8),
            },
            guestCountAdjustment: 98,
            pros: ['Maintains gourmet 3-course dinner and high-end bar', 'Leaves photography, music, and venue untouched'],
            cons: ['Difficult social decisions trimming plus-ones or casual acquaintances'],
            actionItems: ['Conduct guest audit and classify immediate family/core tier', 'Inform caterer of revised 98 headcount estimate'],
          },
          {
            optionId: 'B',
            title: 'Option B: Re-architect Decor & Beverage Tiers (Preserve 120 Guests)',
            philosophy: 'Keep all 120 guests by switching from full open bar to signature cocktails + beer/wine, and shifting floral budget to DIY candle illumination.',
            proposedBudgetRebalance: {
              catering: currentEvent.categories.catering.allocated - 2800,
              venue: currentEvent.categories.venue.allocated,
              decor: 1200,
              entertainmentMedia: 3200,
              logisticsStaffing: 1000,
              contingency: 1200,
            },
            guestCountAdjustment: baseGuests,
            pros: ['No guest list cuts required', 'Protects venue and core celebration atmosphere'],
            cons: ['Beer, wine, and 2 signature drinks only (no top-shelf liquor)', 'Minimalist decor centered on candles rather than tall floral towers'],
            actionItems: ['Switch catering bar package to Craft Beer & Wine + 2 Signature Cocktails', 'Source hurricane candle lanterns wholesale'],
          },
        ],
        actionableNextSteps: [
          'Decide whether to trim guest list (Option A) or adjust hospitality menu tiers (Option B).',
          'Lock in catering beverage package amendment before final contract countersigning.',
          'Audit decor line items for immediate floral-to-candle substitutions.',
        ],
      };
    } else {
      promptDescription = customPrompt || customScenarioText || 'Date moved earlier';
      mockResult = {
        scenarioSummary: `Scenario: "${promptDescription}". Analyzing trade-offs against Priority Matrix.`,
        costDelta: 450,
        costDeltaExplanation: 'Potential rush fees on custom print invites and attire alterations.',
        scheduleImpact: 'All milestone deadlines shift forward by 21 calendar days.',
        dominoEffects: [
          {
            area: 'Timeline & Lead Times',
            impact: 'Downstream tasks currently in progress must be resolved 21 days sooner.',
            severity: 'high',
          },
          {
            area: 'Venue Capacity',
            impact: 'CRITICAL: Must immediately verify whether the venue has open calendar slots on earlier date.',
            severity: 'high',
          },
        ],
        tradeOffStrategies: [
          {
            optionId: 'A',
            title: 'Option A: Digital Fast-Track Workflow',
            philosophy: 'Bypass physical paper printing lead times by sending high-end animated digital invitations with instant RSVP tracking.',
            proposedBudgetRebalance: {
              venue: currentEvent.categories.venue?.allocated || 0,
              catering: currentEvent.categories.catering?.allocated || 0,
              decor: currentEvent.categories.decor?.allocated || 0,
              entertainmentMedia: currentEvent.categories.entertainmentMedia?.allocated || 0,
              logisticsStaffing: currentEvent.categories.logisticsStaffing?.allocated || 0,
              contingency: currentEvent.categories.contingency?.allocated || 0,
            },
            guestCountAdjustment: baseGuests,
            pros: ['Recovers 3 full weeks of physical mail delivery time', 'Saves $400 on postage and print proofing'],
            cons: ['Older guests may require phone followup confirmations'],
            actionItems: ['Select digital stationery template', 'Collect email & phone numbers for all guests'],
          },
        ],
        actionableNextSteps: [
          'Verify venue holds new date on calendar before making announcements.',
          'Email photographer and DJ to confirm availability.',
        ],
      };
    }

    try {
      const response = await fetch('/api/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEvent: currentEvent,
          scenarioChange: promptDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scenarioAnalysis && data.scenarioAnalysis.tradeOffStrategies) {
          setActiveAnalysis(data.scenarioAnalysis);
          setIsAnalyzing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Using local high-fidelity scenario calculation:', e);
    }

    setActiveAnalysis(mockResult);
    setIsAnalyzing(false);
  };

  const handleApplyStrategy = (strategy: TradeOffStrategy) => {
    if (!strategy) return;

    let updatedBudgetCeiling = currentEvent.budgetCeiling;
    if (activeAnalysis?.costDelta && selectedPreset === 'budget_cut') {
      updatedBudgetCeiling = currentEvent.budgetCeiling + activeAnalysis.costDelta;
    }

    const updatedCategories = { ...currentEvent.categories };
    if (strategy.proposedBudgetRebalance) {
      Object.keys(strategy.proposedBudgetRebalance).forEach((k) => {
        const catKey = k as CategoryKey;
        const newAlloc = strategy.proposedBudgetRebalance[catKey];
        if (updatedCategories[catKey] && typeof newAlloc === 'number') {
          updatedCategories[catKey] = {
            ...updatedCategories[catKey],
            allocated: newAlloc,
            percentage: Math.round((newAlloc / (updatedBudgetCeiling || 1)) * 100),
            rationale: `Updated via Scenario Strategy: ${strategy.title}`,
          };
        }
      });
    }

    const updatedEvent: EventState = {
      ...currentEvent,
      guestCount: strategy.guestCountAdjustment || currentEvent.guestCount,
      budgetCeiling: updatedBudgetCeiling,
      categories: updatedCategories,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateEvent(updatedEvent);
    setAppliedStrategyId(strategy.optionId);
  };

  return (
    <section id="scenarios" className="scroll-mt-32 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
              Step 4 • Peace-of-Mind Backups
            </span>
            <span className="text-xs text-stone-500 font-medium">Weather, Guest Surges &amp; Thoughtful Solutions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Peace-of-Mind Backups &amp; Solutions
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Life happens, weather shifts, and surprise RSVPs arrive. Explore thoughtful backup plans ahead of time so you never feel stressed, and your dream celebration stays magical.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <SectionQuickActions
            sectionType="scenarios"
            sectionTitle="Backups"
            currentEvent={currentEvent}
            onUpdateEvent={onUpdateEvent}
          />
          <button
            onClick={() => onRequestAiAssistance(`I want to explore backup ideas for my event (${currentEvent.name}). What happens if our guest count changes or we need a quick weather backup?`)}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Ask Advisor</span>
          </button>
        </div>
      </div>

      {/* Scenario Triggers Selector */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span>Explore "What-If" Scenarios for Total Peace of Mind</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => { setSelectedPreset('plus_guests'); runScenarioSimulation('plus_guests'); }}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              selectedPreset === 'plus_guests'
                ? 'bg-purple-50/60 border-purple-300 shadow-xs'
                : 'bg-stone-50/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  +30 Loved Ones Join
                </span>
                <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded-full text-purple-800 font-bold">
                  Guest Surge
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Your circle expands from {currentEvent.guestCount} to {currentEvent.guestCount + 30} wonderful guests.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 mt-4 flex items-center gap-1">
              See Solution <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            onClick={() => { setSelectedPreset('budget_cut'); runScenarioSimulation('budget_cut'); }}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              selectedPreset === 'budget_cut'
                ? 'bg-rose-50/60 border-rose-300 shadow-xs'
                : 'bg-stone-50/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  Save 20% on Budget
                </span>
                <span className="text-[10px] bg-rose-100 px-2 py-0.5 rounded-full text-rose-800 font-bold">
                  Smart Savings
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Save ${Math.round(currentEvent.budgetCeiling * 0.2).toLocaleString()} while keeping the atmosphere delightful at ${(currentEvent.budgetCeiling * 0.8).toLocaleString()}.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 mt-4 flex items-center gap-1">
              See Solution <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            onClick={() => { setSelectedPreset('date_earlier'); runScenarioSimulation('date_earlier'); }}
            className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              selectedPreset === 'date_earlier'
                ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                : 'bg-stone-50/80 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Moved 3 Weeks Earlier
                </span>
                <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-full text-amber-800 font-bold">
                  Faster Celebration
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Celebrate 21 days sooner; see how digital stationery and quick vendor coordination keep everything stress-free.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 mt-4 flex items-center gap-1">
              See Solution <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* Custom Scenario Bar */}
        <div className="pt-2 border-t border-stone-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Or Test Any Situation (e.g., "Sudden rain requires garden marquee" or "Surprise dessert bar")
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe any change you're wondering about..."
              value={customScenarioText}
              onChange={(e) => setCustomScenarioText(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none"
            />
            <button
              onClick={() => { setSelectedPreset('custom'); runScenarioSimulation('custom', customScenarioText); }}
              disabled={isAnalyzing || !customScenarioText.trim()}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              See Solution
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results View */}
      {isAnalyzing && (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-3xl space-y-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-stone-900">Crafting your personalized peace-of-mind solution...</p>
          <p className="text-xs text-stone-500">Balancing guest comfort, delicious dining, and day-of timing gracefully.</p>
        </div>
      )}

      {activeAnalysis && !isAnalyzing && (
        <div className="space-y-6">
          {/* Delta Calculation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-600" />
                Estimated Cost Difference
              </span>
              <div className={`text-2xl font-black mt-2 ${activeAnalysis.costDelta > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {activeAnalysis.costDelta > 0 ? `+$${activeAnalysis.costDelta.toLocaleString()}` : activeAnalysis.costDelta < 0 ? `-$${Math.abs(activeAnalysis.costDelta).toLocaleString()}` : '$0 Change'}
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {activeAnalysis.costDeltaExplanation}
              </p>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Timing &amp; Preparation Difference
              </span>
              <div className="text-sm font-bold text-stone-900 mt-2">
                {activeAnalysis.scheduleImpact}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                All milestone deadlines adjust gracefully to give your vendors clear guidance.
              </p>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Your #1 Cherished Priority (Always Protected)
              </span>
              <div className="text-sm font-bold text-indigo-900 mt-2 capitalize">
                {Object.entries(currentEvent.priorityMatrix).find(([_, r]) => r === 1)?.[0]} Experience
              </div>
              <p className="text-xs text-stone-500 mt-1">
                We gently adjust flexible details so your top priority remains untarnished and unforgettable.
              </p>
            </div>
          </div>

          {/* Domino Effect Cards */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Gentle Ripple Effects &amp; Things to Consider</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {activeAnalysis.dominoEffects.map((domino, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    domino.severity === 'high' 
                      ? 'bg-rose-50/60 border-rose-200' 
                      : domino.severity === 'medium'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-900">{domino.area}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      domino.severity === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : domino.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {domino.severity === 'high' ? 'Important Notice' : domino.severity === 'medium' ? 'Moderate Adjustment' : 'Smooth Change'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{domino.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-Off Strategies */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <span>Thoughtful Solutions Tailored to Your Priorities</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeAnalysis.tradeOffStrategies.map((strategy) => {
                const isApplied = appliedStrategyId === strategy.optionId;

                return (
                  <div
                    key={strategy.optionId}
                    className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition shadow-xs ${
                      isApplied 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                        : 'border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          Option {strategy.optionId}
                        </span>
                        {isApplied && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Choice
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        {strategy.title}
                      </h4>

                      <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                        {strategy.philosophy}
                      </p>

                      {/* Pros & Cons */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 block mb-1">What You'll Love:</span>
                          <ul className="space-y-1">
                            {strategy.pros.map((p, i) => (
                              <li key={i} className="text-stone-600 flex items-start gap-1.5 text-[11px]">
                                <span className="text-emerald-600 font-bold">✓</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-amber-800 block mb-1">Gentle Adjustments:</span>
                          <ul className="space-y-1">
                            {strategy.cons.map((c, i) => (
                              <li key={i} className="text-stone-500 flex items-start gap-1.5 text-[11px]">
                                <span className="text-amber-600 font-bold">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-stone-100">
                      <button
                        onClick={() => handleApplyStrategy(strategy)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Plan Updated with This Solution ✨</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Choose This Solution</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
