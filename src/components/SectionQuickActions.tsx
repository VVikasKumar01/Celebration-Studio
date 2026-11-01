import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Check, 
  Copy, 
  X, 
  ArrowRight, 
  SlidersHorizontal, 
  Calendar, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Store,
  Clock,
  CloudSun,
  Palette,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { EventState, CategoryKey, TimelineTask } from '../types/event';
import { useModalA11y } from '../hooks/useModalA11y';

export type SectionType = 'discovery' | 'budget' | 'timeline' | 'scenarios' | 'vendors';

export interface QuickActionDef {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SectionQuickActionsProps {
  sectionType: SectionType;
  sectionTitle: string;
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  className?: string;
}

const SECTION_ACTIONS: Record<SectionType, QuickActionDef[]> = {
  discovery: [
    {
      id: 'generate_initial_plan',
      title: 'Generate initial plan',
      description: 'Create a tailored celebration blueprint with balanced allocations and timeline roadmap.',
      icon: Sparkles,
      badge: 'Popular',
    },
    {
      id: 'suggest_atmosphere',
      title: 'Suggest celebration mood & styling',
      description: 'Get tailored color themes, floral styles, and music ambiance for your date and guest count.',
      icon: Palette,
    },
    {
      id: 'guest_hospitality_balance',
      title: 'Recommend guest hospitality balance',
      description: 'Calculate ideal per-guest dining, bar, and comfort ratios for smooth hospitality.',
      icon: Users,
    },
  ],
  budget: [
    {
      id: 'suggest_budget_breakdown',
      title: 'Suggest budget breakdown',
      description: 'Rebalance allocations across all 6 areas based on your priorities with 1-click update.',
      icon: SlidersHorizontal,
      badge: '1-Click Apply',
    },
    {
      id: 'find_gentle_savings',
      title: 'Find 3 gentle ways to save',
      description: 'Tasteful adjustments to reduce spending without compromising your celebration atmosphere.',
      icon: DollarSign,
    },
    {
      id: 'safety_cushion_recommendation',
      title: 'Recommend safety cushion',
      description: 'Calculate the right emergency buffer for your venue style and guest count.',
      icon: ShieldCheck,
    },
  ],
  timeline: [
    {
      id: 'build_milestone_roadmap',
      title: 'Build milestone roadmap',
      description: 'Generate chronological deadlines and key decision dates from today to celebration day.',
      icon: Calendar,
      badge: '1-Click Apply',
    },
    {
      id: 'what_to_do_this_week',
      title: 'What should I focus on this week?',
      description: 'Highlight your top 3 peaceful next steps without feeling overwhelmed.',
      icon: Clock,
    },
    {
      id: 'day_of_schedule_flow',
      title: 'Draft day-of celebration flow',
      description: 'Create a relaxed hour-by-hour timeline for preparations, ceremony, and reception.',
      icon: HeartHandshake,
    },
  ],
  scenarios: [
    {
      id: 'draft_weather_plan',
      title: 'Draft rain & outdoor backup plan',
      description: 'Prepare an effortless backup plan for ceremony and dining in case of sudden weather shifts.',
      icon: CloudSun,
    },
    {
      id: 'simulate_extra_guests',
      title: 'Simulate +25 extra loved ones',
      description: 'Calculate dining, seating, and budget adjustments if your guest list grows.',
      icon: Users,
      badge: '1-Click Apply',
    },
    {
      id: 'vendor_backup_readiness',
      title: 'Vendor peace-of-mind backup',
      description: 'Prepare a simple standby plan in case any service partner needs a swift replacement.',
      icon: Layers,
    },
  ],
  vendors: [
    {
      id: 'draft_inquiry_message',
      title: 'Draft polite inquiry message',
      description: 'Generate a polished, warm note to send vendors asking for pricing and availability.',
      icon: Store,
    },
    {
      id: 'check_surprise_fees',
      title: 'Check proposals for surprise fees',
      description: 'Scan quotes for hidden service charges, breakdown fees, or overtime minimums.',
      icon: ShieldCheck,
    },
    {
      id: 'compare_top_quotes',
      title: 'Compare top quotes & value',
      description: 'Review your leading venue, catering, and photo choices side-by-side.',
      icon: Sparkles,
    },
  ],
};

export const SectionQuickActions: React.FC<SectionQuickActionsProps> = ({
  sectionType,
  sectionTitle,
  currentEvent,
  onUpdateEvent,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<QuickActionDef | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultContent, setResultContent] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionModalRef = useModalA11y<HTMLDivElement>({
    isOpen: Boolean(activeAction),
    onClose: () => setActiveAction(null),
  });

  const actions = SECTION_ACTIONS[sectionType] || [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleTriggerAction = async (action: QuickActionDef) => {
    setIsOpen(false);
    setActiveAction(action);
    setIsLoading(true);
    setResultContent(null);
    setAppliedSuccess(false);

    try {
      // Execute tailored action logic
      if (action.id === 'generate_initial_plan') {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            occasion: currentEvent.name,
            vibe: currentEvent.vibe,
            guestCount: currentEvent.guestCount,
            budgetCeiling: currentEvent.budgetCeiling,
            targetDate: currentEvent.targetDate,
            priorities: currentEvent.priorityMatrix,
            specialFactors: currentEvent.specialFactors,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.plan && data.plan.budgetAllocation) {
            setResultContent({
              type: 'plan',
              summary: data.plan.summary || `A personalized celebration blueprint tailored for ${currentEvent.guestCount} guests with a budget of $${currentEvent.budgetCeiling.toLocaleString()}.`,
              budgetAllocation: data.plan.budgetAllocation,
              timelineTasks: data.plan.timelineTasks || [],
              nextSteps: data.plan.actionableNextSteps || [
                'Lock in your primary celebration space',
                'Schedule tasting with your preferred caterer',
                'Finalize save-the-date mailing list'
              ],
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // Default high-fidelity celebration advisor generator
      await new Promise((res) => setTimeout(res, 600)); // pleasant brief pause

      if (action.id === 'suggest_budget_breakdown' || action.id === 'generate_initial_plan') {
        const total = currentEvent.budgetCeiling;
        const p = currentEvent.priorityMatrix;
        const guests = currentEvent.guestCount || 1;

        const rankWeights: Record<number, number> = { 1: 0.38, 2: 0.26, 3: 0.15, 4: 0.09, 5: 0.06, 6: 0.06 };
        const rawShares = {
          catering: rankWeights[p.catering || 1] || 0.35,
          venue: rankWeights[p.venue || 2] || 0.25,
          entertainmentMedia: rankWeights[p.entertainmentMedia || 3] || 0.15,
          decor: rankWeights[p.decor || 4] || 0.10,
          logisticsStaffing: 0.05,
          contingency: 0.05,
        };
        const sum = Object.values(rawShares).reduce((a, b) => a + b, 0);

        const breakdown = {
          catering: { allocated: Math.round((rawShares.catering / sum) * total), percent: Math.round((rawShares.catering / sum) * 100), note: `Generous dining & craft cocktail service (~$${Math.round(((rawShares.catering / sum) * total) / guests)}/guest).` },
          venue: { allocated: Math.round((rawShares.venue / sum) * total), percent: Math.round((rawShares.venue / sum) * 100), note: 'Primary event space, grounds access, and seating foundation.' },
          entertainmentMedia: { allocated: Math.round((rawShares.entertainmentMedia / sum) * total), percent: Math.round((rawShares.entertainmentMedia / sum) * 100), note: 'Documentary photography and warm musical ambiance.' },
          decor: { allocated: Math.round((rawShares.decor / sum) * total), percent: Math.round((rawShares.decor / sum) * 100), note: 'Candlelight styling, floral centerpieces, and place settings.' },
          logisticsStaffing: { allocated: Math.round((rawShares.logisticsStaffing / sum) * total), percent: Math.round((rawShares.logisticsStaffing / sum) * 100), note: 'Day-of coordination, guest transportation, and permits.' },
          contingency: { allocated: Math.round((rawShares.contingency / sum) * total), percent: Math.round((rawShares.contingency / sum) * 100), note: 'Peace-of-mind buffer for weather or overtime safety.' },
        };

        setResultContent({
          type: 'budget',
          title: `Recommended Budget Breakdown ($${total.toLocaleString()})`,
          summary: `Balanced specifically for your ${guests} guests and prioritized categories, keeping 5% as a calm emergency cushion.`,
          breakdown,
        });
      } else if (action.id === 'suggest_atmosphere') {
        setResultContent({
          type: 'text_cards',
          title: 'Curated Celebration Mood & Atmosphere',
          summary: `Designed to bring warmth, romance, and intimacy to "${currentEvent.name}".`,
          cards: [
            { title: 'Color Palette', text: 'Soft champagne, warm sandstone, dusty rose, and olive branch foliage with antique brass accents.' },
            { title: 'Lighting & Tablescapes', text: 'Low taper candles in clear glass chimneys, textured linen runners, and low floral arrangements so guests can easily converse.' },
            { title: 'Musical Progression', text: 'Acoustic indie folk guitar during welcoming drinks, warm jazz quartet over dinner, and an upbeat soul/funk set for evening dancing.' },
            { title: 'Thoughtful Signature Touch', text: 'A handwritten welcome card at each guest place setting with a personalized memory or thank-you.' },
          ]
        });
      } else if (action.id === 'guest_hospitality_balance') {
        const perGuest = Math.round(currentEvent.budgetCeiling / (currentEvent.guestCount || 1));
        setResultContent({
          type: 'text_cards',
          title: 'Guest Hospitality Comfort Balance',
          summary: `With ${currentEvent.guestCount} guests and an overall spend of ~$${perGuest} per guest, here is the golden ratio for comfortable hosting:`,
          cards: [
            { title: 'Food & Beverage ($' + Math.round(perGuest * 0.42) + '/guest)', text: 'Plated 3-course dinner with 2 signature cocktails, flowing wine, and late-night warm bites (like sliders or flatbreads).' },
            { title: 'Comfort & Seating ($' + Math.round(perGuest * 0.15) + '/guest)', text: 'Padded chairs, ample lounge vignette seating near the bar, and shade/heaters depending on the weather.' },
            { title: 'Staffing Ratio', text: '1 server per 10-12 guests and 1 bartender per 35-40 guests to eliminate long beverage lines.' },
            { title: 'Hospitality Tip', text: 'Offer a refreshing welcome drink upon guest arrival (e.g., lavender lemonade or sparkling cider) before the ceremony begins.' }
          ]
        });
      } else if (action.id === 'find_gentle_savings') {
        setResultContent({
          type: 'text_cards',
          title: '3 Gentle Ways to Save Without Losing Joy',
          summary: 'Savvy choices that maintain a luxurious atmosphere while comfortably trimming costs:',
          cards: [
            { title: '1. Repurpose Ceremony Florals to Dining Tables', text: 'Have your coordinator move the ceremony arch arrangements and aisle flowers onto the head table and bar during cocktail hour. Saves $1,200 – $2,000 on duplicate florals.' },
            { title: '2. Signature Cocktails + Wine & Beer Bar', text: 'Rather than a full open liquor bar with dozens of spirits, offer 2 exquisite craft cocktails plus regional wines and local craft beers. Saves ~$15 per guest with high satisfaction.' },
            { title: '3. Digital Save-the-Dates with Letterpress Invitations', text: 'Send charming digital animated save-the-dates, saving printed paper and postage for the formal wedding invitation suite. Saves $400 – $700.' }
          ]
        });
      } else if (action.id === 'safety_cushion_recommendation') {
        const total = currentEvent.budgetCeiling;
        const recommendedCushion = Math.round(total * 0.06);
        setResultContent({
          type: 'text_cards',
          title: 'Recommended Safety Buffer',
          summary: `For your event scale ($${total.toLocaleString()}), we recommend reserving $${recommendedCushion.toLocaleString()} (6%) as a peace-of-mind cushion.`,
          cards: [
            { title: 'Weather & Tenting Reserve', text: 'Covers sudden rain flaps, patio umbrellas, or heater rentals if temperatures dip.' },
            { title: 'Service Overtime Cushion', text: 'Allows you to extend your DJ and bartender by an extra hour without stressing if everyone is having a marvelous time.' },
            { title: 'Last-Minute Guest Accommodations', text: 'Covers late dietary additions, extra vendor meals, and day-of steaming or deliveries.' }
          ]
        });
      } else if (action.id === 'build_milestone_roadmap') {
        setResultContent({
          type: 'timeline',
          title: 'Key Milestones for Your Celebration',
          summary: `Chronological roadmap from 6 months out to celebration morning:`,
          milestones: [
            { period: '6 Months Out', title: 'Lock Venue & Select Core Catering', note: 'Secure your date and tasting schedule.' },
            { period: '4 Months Out', title: 'Book Photographer & Music Team', note: 'Review storytelling portfolios and song preferences.' },
            { period: '2 Months Out', title: 'Send Invitations & Design Florals', note: 'Collect RSVPs and select tablescape linens.' },
            { period: '1 Month Out', title: 'Finalize Seating & Confirm Menu', note: 'Lock guest counts with the kitchen.' },
            { period: 'Week-Of', title: 'Hand Over Timeline to Day-of Coordinator', note: 'Rest, pack your outfits, and enjoy the anticipation.' },
          ]
        });
      } else if (action.id === 'what_to_do_this_week') {
        setResultContent({
          type: 'text_cards',
          title: 'What to Focus on This Week',
          summary: 'Keep planning enjoyable and calm by focusing exclusively on these 3 gentle decisions:',
          cards: [
            { title: '1. Review Caterer Tasting Options', text: 'Pick 3 appetizers and 2 main courses that celebrate your favorite flavors and seasonal produce.' },
            { title: '2. Check In With Your Storyteller / Photographer', text: 'Send them a quick 5-bullet list of VIP family moments you want captured.' },
            { title: '3. Schedule One Evening Off', text: 'Take a relaxed dinner date without talking about event planning—keeping your joy first!' }
          ]
        });
      } else if (action.id === 'day_of_schedule_flow') {
        setResultContent({
          type: 'timeline',
          title: 'Smooth Day-Of Celebration Flow',
          summary: 'A relaxed schedule designed to keep you present and happy throughout the day:',
          milestones: [
            { period: '10:00 AM', title: 'Morning Coffee & Getting Ready', note: 'Relaxed breakfast, hair & makeup, favorite playlist.' },
            { period: '02:00 PM', title: 'First Look & Intimate Portraits', note: 'Unrushed photography while hair and flowers are pristine.' },
            { period: '04:00 PM', title: 'Guest Arrival & Welcome Music', note: 'Refreshing drinks and background acoustic melodies.' },
            { period: '04:30 PM', title: 'Heartfelt Ceremony', note: 'Exchanging vows surrounded by loved ones (30-40 mins).' },
            { period: '05:15 PM', title: 'Cocktail Hour & Passed Bites', note: 'Mingle, laugh, and enjoy signature craft cocktails.' },
            { period: '06:45 PM', title: 'Dinner, Toasts & Candlelight', note: 'Delicious multi-course meal and heartfelt speeches.' },
            { period: '08:30 PM', title: 'Dance Floor Celebration', note: 'Dessert station, joyous dancing, and late-night snacks.' }
          ]
        });
      } else if (action.id === 'draft_weather_plan') {
        setResultContent({
          type: 'text_cards',
          title: 'Rain & Outdoor Weather Peace-of-Mind Plan',
          summary: 'A serene backup plan to make any weather feel cozy and intentional:',
          cards: [
            { title: 'The 72-Hour Weather Decision Window', text: 'Agree in advance with your venue that the weather decision will be made 72 hours prior to avoid last-minute stress.' },
            { title: 'Seamless Ceremony Pivot', text: 'Move chairs indoors under the existing romantic lighting; add extra pillar candles along the aisle for instant warmth.' },
            { title: 'Guest Comfort Amenities', text: 'Provide clear bubble umbrellas for picturesque photo walks, plus hot cider or cocoa upon guest arrival.' }
          ]
        });
      } else if (action.id === 'simulate_extra_guests') {
        const perGuestCost = Math.round(currentEvent.budgetCeiling / (currentEvent.guestCount || 1));
        const addedCost = 25 * Math.round(perGuestCost * 0.45);
        setResultContent({
          type: 'scenario',
          title: 'Impact of Adding +25 Loved Ones',
          summary: `Welcoming 25 additional guests (new total: ${currentEvent.guestCount + 25} guests):`,
          details: [
            { label: 'Estimated Extra Catering & Bar', value: `+$${addedCost.toLocaleString()}` },
            { label: 'Additional Tables & Chairs', value: '2-3 additional round tables or 2 long banquets' },
            { label: 'New Recommended Total Budget', value: `$${(currentEvent.budgetCeiling + addedCost).toLocaleString()}` },
          ],
          advice: 'You can easily balance this by slightly streamlining duplicate floral arrangements or opting for a signature cocktail menu rather than an open bar.'
        });
      } else if (action.id === 'vendor_backup_readiness') {
        setResultContent({
          type: 'text_cards',
          title: 'Vendor Standby Plan',
          summary: 'Protecting your key services with total peace of mind:',
          cards: [
            { title: 'Secondary Lead Photographer', text: 'Ensure your primary photographer has an associate in their studio ready to step in if illness occurs.' },
            { title: 'Kitchen Staff Cross-Coverage', text: 'Professional caterers always staff extra culinary assistants to maintain impeccable service speed.' },
            { title: 'Music & Audio Redundancy', text: 'Your DJ or musician should always bring dual speakers and an offline backup playlist on an iPad.' }
          ]
        });
      } else if (action.id === 'draft_inquiry_message') {
        setResultContent({
          type: 'email_template',
          title: 'Polite Vendor Inquiry Note',
          summary: 'Copy and send this warm, professional email to inquire about availability and pricing:',
          subject: `Celebration Inquiry: ${currentEvent.name} — ${currentEvent.targetDate}`,
          body: `Warm greetings,\n\nWe are currently planning our celebration, "${currentEvent.name}", scheduled for ${currentEvent.targetDate} with approximately ${currentEvent.guestCount} guests. We have long admired your artistry and work, and we would love to learn more about your availability and offerings.\n\nCould you please share:\n1. Your availability for ${currentEvent.targetDate}\n2. Your standard service collections and investment guide\n3. Details on what is included, as well as any setup or travel policies\n\nWe look forward to hearing from you and hope to partner together for our special day!\n\nWarm regards,\n${currentEvent.name.split(' - ')[0]}`
        });
      } else if (action.id === 'check_surprise_fees') {
        setResultContent({
          type: 'text_cards',
          title: 'Common Hidden Fees to Watch For',
          summary: 'Ask your vendors these 4 gentle questions before signing any agreement:',
          cards: [
            { title: '1. Service Charge vs. Staff Gratuity', text: 'Ask: "Is the 20-22% service fee shared with the service team, or do we provide separate gratuity?"' },
            { title: '2. Setup, Teardown & Delivery Windows', text: 'Ask: "Does the quote include full setup and cleanup, or is there a delivery fee based on hours?"' },
            { title: '3. Corkage & Cake Cutting Fees', text: 'Ask: "If we bring our own specialty wine or bakery cake, is there a per-bottle or per-slice fee?"' },
            { title: '4. Overtime Rates', text: 'Ask: "What is the hourly fee if the celebration runs past the scheduled end time?"' }
          ]
        });
      } else if (action.id === 'compare_top_quotes') {
        setResultContent({
          type: 'text_cards',
          title: 'How to Compare Your Top Quotes',
          summary: 'A simple guide to choosing the vendor that gives you the greatest peace of mind:',
          cards: [
            { title: 'Look Beyond the Bottom Line', text: 'A quote that seems $500 higher may include full cleanup, table linens, and insurance, saving you time and stress.' },
            { title: 'Personal Chemistry & Communication', text: 'Choose the team that communicates clearly, warmly, and responds promptly to your questions.' },
            { title: 'Trust Your Gut Feeling', text: 'The right vendor partner makes you feel supported, heard, and excited about the day.' }
          ]
        });
      }
    } catch (err) {
      console.error('Quick action error:', err);
      setResultContent({
        type: 'text_cards',
        title: 'Sarah’s Recommendation',
        summary: 'Here is tailored guidance for your celebration:',
        cards: [
          { title: 'Keep Priorities Front and Center', text: `For "${currentEvent.name}", focus on your top chosen priorities first.` },
          { title: 'Next Steps', text: 'Review your budget balance and connect with your venue to confirm available celebration hours.' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToCelebration = () => {
    if (!resultContent) return;

    if (activeAction?.id === 'suggest_budget_breakdown' || activeAction?.id === 'generate_initial_plan') {
      if (resultContent.breakdown) {
        const updatedCategories = { ...currentEvent.categories };
        Object.entries(resultContent.breakdown).forEach(([key, val]: [string, any]) => {
          const catKey = key as CategoryKey;
          if (updatedCategories[catKey]) {
            updatedCategories[catKey] = {
              ...updatedCategories[catKey],
              allocated: val.allocated,
              percentage: val.percent,
              rationale: val.note,
            };
          }
        });

        const updatedEvent: EventState = {
          ...currentEvent,
          categories: updatedCategories,
          lastUpdated: new Date().toISOString(),
        };

        onUpdateEvent(updatedEvent);
        setAppliedSuccess(true);
      }
    } else if (activeAction?.id === 'simulate_extra_guests') {
      const perGuestCost = Math.round(currentEvent.budgetCeiling / (currentEvent.guestCount || 1));
      const addedCost = 25 * Math.round(perGuestCost * 0.45);
      const updatedEvent: EventState = {
        ...currentEvent,
        guestCount: currentEvent.guestCount + 25,
        budgetCeiling: currentEvent.budgetCeiling + addedCost,
        lastUpdated: new Date().toISOString(),
      };
      onUpdateEvent(updatedEvent);
      setAppliedSuccess(true);
    } else if (activeAction?.id === 'build_milestone_roadmap') {
      if (resultContent.milestones) {
        const newTasks: TimelineTask[] = resultContent.milestones.map((m: any, idx: number) => ({
          id: `task-quick-${Date.now()}-${idx}`,
          title: m.title,
          milestone: idx === 0 ? 'T-24W' : idx === 1 ? 'T-16W' : idx === 2 ? 'T-8W' : idx === 3 ? 'T-4W' : 'Day-Of',
          dueDate: currentEvent.targetDate,
          category: 'Coordination',
          priority: 'high',
          dependsOn: [],
          actionableNote: m.note,
          status: 'pending' as const,
        }));

        const updatedEvent: EventState = {
          ...currentEvent,
          tasks: [...newTasks, ...currentEvent.tasks],
          lastUpdated: new Date().toISOString(),
        };
        onUpdateEvent(updatedEvent);
        setAppliedSuccess(true);
      }
    } else {
      setAppliedSuccess(true);
    }
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (resultContent?.body) {
      textToCopy = resultContent.body;
    } else if (resultContent?.cards) {
      textToCopy = resultContent.cards.map((c: any) => `${c.title}\n${c.text}`).join('\n\n');
    } else if (resultContent?.breakdown) {
      textToCopy = Object.entries(resultContent.breakdown)
        .map(([k, v]: [string, any]) => `${k}: $${v.allocated.toLocaleString()} (${v.percent}%) - ${v.note}`)
        .join('\n');
    } else {
      textToCopy = JSON.stringify(resultContent, null, 2);
    }

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const canApply = 
    activeAction?.id === 'suggest_budget_breakdown' || 
    activeAction?.id === 'generate_initial_plan' || 
    activeAction?.id === 'simulate_extra_guests' ||
    activeAction?.id === 'build_milestone_roadmap';

  return (
    <>
      {/* Floating Pill Button & Dropdown Container */}
      <div className={`relative inline-block ${className}`} ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-stone-800 cursor-pointer"
          title={`Quick AI Actions for ${sectionTitle}`}
          aria-expanded={isOpen}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>Quick Actions</span>
          <ChevronDown className={`w-3.5 h-3.5 text-stone-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Floating Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-2xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {sectionTitle} Actions
              </span>
              <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                Instant AI
              </span>
            </div>

            <div className="py-1 space-y-1">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleTriggerAction(action)}
                    className="w-full text-left p-2.5 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-amber-100/70 text-stone-700 group-hover:text-amber-900 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 group-hover:text-amber-950 truncate">
                          {action.title}
                        </span>
                        {action.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 rounded-md shrink-0">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Modal / Overlay Dialog (Does NOT open main AI drawer) */}
      {activeAction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-action-modal-title"
        >
          <div 
            ref={actionModalRef}
            className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="quick-action-modal-title" className="text-sm sm:text-base font-bold text-stone-900">
                    {activeAction.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sarah's Celebration Recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer"
                title="Close"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center animate-bounce">
                    <Sparkles className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">
                      Sarah is tailoring your recommendation...
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      Balancing your event details and budget with calm care.
                    </p>
                  </div>
                </div>
              ) : resultContent ? (
                <div className="space-y-5">
                  {/* Summary Callout */}
                  {resultContent.summary && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                        {resultContent.summary}
                      </p>
                    </div>
                  )}

                  {/* Budget Breakdown Table */}
                  {resultContent.breakdown && (
                    <div className="border border-stone-200 rounded-2xl overflow-hidden">
                      <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex justify-between text-xs font-bold text-stone-600">
                        <span>Category</span>
                        <div className="flex gap-8">
                          <span>Share</span>
                          <span className="w-20 text-right">Allocation</span>
                        </div>
                      </div>
                      <div className="divide-y divide-stone-100 text-xs">
                        {Object.entries(resultContent.breakdown).map(([k, v]: [string, any]) => (
                          <div key={k} className="p-3 sm:px-4 flex items-center justify-between hover:bg-stone-50/50">
                            <div>
                              <span className="font-bold text-stone-900 capitalize">
                                {k === 'entertainmentMedia' ? 'Photography & Music' : k === 'logisticsStaffing' ? 'Logistics & Staffing' : k}
                              </span>
                              <p className="text-[11px] text-stone-500 mt-0.5">{v.note}</p>
                            </div>
                            <div className="flex items-center gap-8 pl-4 shrink-0">
                              <span className="text-stone-600 font-semibold">{v.percent}%</span>
                              <span className="w-20 text-right font-bold text-stone-900">
                                ${v.allocated.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Cards Grid */}
                  {resultContent.cards && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {resultContent.cards.map((c: any, i: number) => (
                        <div key={i} className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            {c.title}
                          </h4>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline Milestones List */}
                  {resultContent.milestones && (
                    <div className="space-y-2.5">
                      {resultContent.milestones.map((m: any, i: number) => (
                        <div key={i} className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3">
                          <div className="px-2.5 py-1 bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-lg shrink-0">
                            {m.period}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{m.title}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5">{m.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scenario Impact */}
                  {resultContent.details && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {resultContent.details.map((d: any, i: number) => (
                          <div key={i} className="p-3 bg-white border border-stone-200 rounded-xl">
                            <p className="text-[10px] text-stone-500 font-bold uppercase">{d.label}</p>
                            <p className="text-xs sm:text-sm font-black text-stone-900 mt-1">{d.value}</p>
                          </div>
                        ))}
                      </div>
                      {resultContent.advice && (
                        <p className="text-xs text-stone-600 italic">
                          "{resultContent.advice}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email Template */}
                  {resultContent.body && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-stone-100 rounded-xl text-xs font-medium text-stone-700">
                        <strong>Subject:</strong> {resultContent.subject}
                      </div>
                      <pre className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 font-sans whitespace-pre-wrap leading-relaxed">
                        {resultContent.body}
                      </pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/60">
              <button
                onClick={handleCopy}
                disabled={isLoading || !resultContent}
                className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard' : 'Copy Recommendation'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                {canApply && (
                  <button
                    onClick={handleApplyToCelebration}
                    disabled={appliedSuccess || isLoading || !resultContent}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      appliedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-800 hover:bg-amber-900 text-white shadow-xs'
                    }`}
                  >
                    {appliedSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied to Celebration!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Apply to Celebration</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
