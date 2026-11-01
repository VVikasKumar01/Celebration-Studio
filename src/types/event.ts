export type CategoryKey = 
  | 'venue' 
  | 'catering' 
  | 'decor' 
  | 'entertainmentMedia' 
  | 'logisticsStaffing' 
  | 'contingency';

export interface CategoryAllocation {
  key: CategoryKey;
  label: string;
  allocated: number;
  spent: number;
  percentage: number;
  rationale: string;
  priorityRank: number; // 1 = highest
}

export interface BudgetItem {
  id: string;
  category: CategoryKey;
  name: string;
  type: 'estimated_assumption' | 'verified_quote';
  amount: number;
  status: 'projected' | 'contracted' | 'paid';
  vendorRef?: string;
  notes?: string;
}

export type MilestoneKey = 
  | 'T-24W' 
  | 'T-16W' 
  | 'T-12W' 
  | 'T-8W' 
  | 'T-4W' 
  | 'T-2W' 
  | 'T-1W' 
  | 'T-1D' 
  | 'Day-Of' 
  | 'Post-Event';

export interface TimelineTask {
  id: string;
  title: string;
  milestone: MilestoneKey;
  dueDate: string;
  category: string;
  priority: 'critical' | 'high' | 'medium';
  dependsOn: string[]; // task IDs that must be completed
  actionableNote: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  assignedTo?: string;
}

export interface VendorFee {
  name: string;
  amountOrRate: string;
  estimatedCost: number;
  isTaxOrGratuity?: boolean;
}

export type ProcurementStatus = 
  | 'pending' 
  | 'reviewed' 
  | 'approved' 
  | 'rejected' 
  | 'inquiry' 
  | 'quote_received' 
  | 'under_review' 
  | 'contracted';

export type VendorCategory = 'Venue' | 'Catering' | 'Photography' | 'Decor & Florals' | 'Music & DJ' | 'Logistics';

export interface VendorQuote {
  id: string;
  vendorName: string;
  category: VendorCategory;
  baseQuote: number;
  hiddenFees: VendorFee[];
  trueTotalCost: number;
  scopeIncluded: string[];
  scopeExcludedOrExtra: string[];
  redFlags: string[];
  missingDetails: string[];
  status: ProcurementStatus;
  notes?: string;
  imageUrl?: string;
}

export interface SpecialFactors {
  dietaryNuances: string[];
  ageDemographics: string;
  accessibilityNeeds: string;
  venueRestrictions: string;
  culturalTraditions: string;
}

export interface DominoEffect {
  area: 'Catering' | 'Venue Capacity' | 'Timeline & Lead Times' | 'Logistics & Staffing';
  impact: string;
  severity: 'high' | 'medium' | 'low';
}

export interface TradeOffStrategy {
  optionId: 'A' | 'B' | 'C';
  title: string;
  philosophy: string;
  proposedBudgetRebalance: Record<CategoryKey, number>;
  guestCountAdjustment: number;
  pros: string[];
  cons: string[];
  actionItems: string[];
}

export interface ScenarioAnalysis {
  scenarioSummary: string;
  costDelta: number;
  costDeltaExplanation: string;
  scheduleImpact: string;
  dominoEffects: DominoEffect[];
  tradeOffStrategies: TradeOffStrategy[];
  actionableNextSteps: string[];
}

export interface EventState {
  id: string;
  name: string;
  type: string;
  vibe: string;
  targetDate: string;
  guestCount: number;
  budgetCeiling: number;
  priorityMatrix: {
    venue: number;
    catering: number;
    entertainmentMedia: number;
    decor: number;
    logisticsStaffing: number;
    contingency: number;
  };
  specialFactors: SpecialFactors;
  categories: Record<CategoryKey, CategoryAllocation>;
  budgetItems: BudgetItem[];
  tasks: TimelineTask[];
  vendors: VendorQuote[];
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionPrompts?: string[];
}
