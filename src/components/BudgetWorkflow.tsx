import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  PieChart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Scale, 
  HelpCircle,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { EventState, CategoryKey, BudgetItem } from '../types/event';
import { SectionQuickActions } from './SectionQuickActions';
import { BUDGET_IMAGE_MAP, IMAGES } from '../assets/images';

interface BudgetWorkflowProps {
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

const CATEGORY_IMAGES: Record<CategoryKey, string> = BUDGET_IMAGE_MAP as Record<CategoryKey, string>;

export const BudgetWorkflow: React.FC<BudgetWorkflowProps> = ({
  currentEvent,
  onUpdateEvent,
  onRequestAiAssistance,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'verified_quote' | 'estimated_assumption'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [rebalanceCategory, setRebalanceCategory] = useState<CategoryKey>('catering');
  const [rebalanceAmountDelta, setRebalanceAmountDelta] = useState<number>(1000);
  const [rebalanceRationale, setRebalanceRationale] = useState<string>('');
  const [previousCategories, setPreviousCategories] = useState<typeof currentEvent.categories | null>(null);

  // Form state for adding budget line item
  const [newItemCategory, setNewItemCategory] = useState<CategoryKey>('catering');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'estimated_assumption' | 'verified_quote'>('estimated_assumption');
  const [newItemAmount, setNewItemAmount] = useState<number>(500);
  const [newItemVendor, setNewItemVendor] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  const categories = currentEvent.categories;
  const budgetItems = currentEvent.budgetItems;

  // Memoized totals and aggregations
  const totalCeiling = currentEvent.budgetCeiling;
  const totalAllocated = useMemo(
    () => Object.values(categories).reduce((acc, c) => acc + c.allocated, 0),
    [categories]
  );

  const { verifiedQuotesTotal, estimatedAssumptionsTotal } = useMemo(() => {
    let verified = 0;
    let estimated = 0;
    for (const b of budgetItems) {
      if (b.type === 'verified_quote') {
        verified += b.amount;
      } else {
        estimated += b.amount;
      }
    }
    return { verifiedQuotesTotal: verified, estimatedAssumptionsTotal: estimated };
  }, [budgetItems]);

  const totalCommittedAndProjected = verifiedQuotesTotal + estimatedAssumptionsTotal;
  const remainingUnallocated = totalCeiling - totalAllocated;
  const contingencyBuffer = categories.contingency?.allocated || 0;

  // Filter items (memoized)
  const filteredItems = useMemo(() => {
    return budgetItems.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [budgetItems, filterType, filterCategory]);

  // Handle Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemAmount <= 0) return;

    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      category: newItemCategory,
      name: newItemName.trim(),
      type: newItemType,
      amount: Number(newItemAmount),
      status: newItemType === 'verified_quote' ? 'contracted' : 'projected',
      vendorRef: newItemVendor.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
    };

    const updatedItems = [...budgetItems, newItem];

    // Recalculate spent for that category
    const categorySpent = updatedItems
      .filter((i) => i.category === newItemCategory)
      .reduce((acc, i) => acc + i.amount, 0);

    const updatedCategories = {
      ...categories,
      [newItemCategory]: {
        ...categories[newItemCategory],
        spent: categorySpent,
      },
    };

    onUpdateEvent({
      ...currentEvent,
      budgetItems: updatedItems,
      categories: updatedCategories,
      lastUpdated: new Date().toISOString(),
    });

    // Reset form
    setNewItemName('');
    setNewItemAmount(500);
    setNewItemVendor('');
    setNewItemNotes('');
    setIsAddItemModalOpen(false);
  };

  // Handle Delete Item
  const handleDeleteItem = (id: string) => {
    const itemToDelete = budgetItems.find((i) => i.id === id);
    if (!itemToDelete) return;

    const updatedItems = budgetItems.filter((i) => i.id !== id);
    const cat = itemToDelete.category;
    const categorySpent = updatedItems
      .filter((i) => i.category === cat)
      .reduce((acc, i) => acc + i.amount, 0);

    const updatedCategories = {
      ...categories,
      [cat]: {
        ...categories[cat],
        spent: categorySpent,
      },
    };

    onUpdateEvent({
      ...currentEvent,
      budgetItems: updatedItems,
      categories: updatedCategories,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Adaptive Priority-Weighted Rebalancer
  const handleExecuteRebalance = (targetCat: CategoryKey, delta: number) => {
    if (delta === 0) return;

    setPreviousCategories({ ...categories });

    const updatedCats = { ...categories };
    const currentAlloc = updatedCats[targetCat].allocated;
    const newAlloc = Math.max(0, currentAlloc + delta);
    const actualDelta = newAlloc - currentAlloc;

    if (actualDelta === 0) return;

    // Distribute deduction among other categories, pulling from lower priorities first
    const otherKeys = (Object.keys(categories) as CategoryKey[])
      .filter((k) => k !== targetCat)
      .sort((a, b) => {
        return (currentEvent.priorityMatrix[b] || 5) - (currentEvent.priorityMatrix[a] || 5);
      });

    let remainingToAbsorb = actualDelta;
    const deductions: string[] = [];

    for (const key of otherKeys) {
      if (remainingToAbsorb === 0) break;
      const catCurrent = updatedCats[key].allocated;
      if (catCurrent <= 0 && remainingToAbsorb > 0) continue;

      const pull = Math.min(catCurrent * 0.4, remainingToAbsorb);
      const actualPull = Math.round(pull);

      if (actualPull > 0) {
        updatedCats[key] = {
          ...updatedCats[key],
          allocated: catCurrent - actualPull,
          percentage: Math.round(((catCurrent - actualPull) / totalCeiling) * 100),
        };
        remainingToAbsorb -= actualPull;
        deductions.push(`-$${actualPull.toLocaleString()} from ${updatedCats[key].label}`);
      }
    }

    updatedCats[targetCat] = {
      ...updatedCats[targetCat],
      allocated: newAlloc,
      percentage: Math.round((newAlloc / totalCeiling) * 100),
      rationale: `Adjusted by ${delta > 0 ? '+' : ''}$${delta.toLocaleString()} via dynamic priority rebalancer.`,
    };

    setRebalanceRationale(
      `Rebalanced: +$${delta.toLocaleString()} to ${updatedCats[targetCat].label}. Protected Priority Tier 1, absorbed by: ${deductions.join(', ')}.`
    );

    onUpdateEvent({
      ...currentEvent,
      categories: updatedCats,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleUndoRebalance = () => {
    if (!previousCategories) return;
    onUpdateEvent({
      ...currentEvent,
      categories: previousCategories,
      lastUpdated: new Date().toISOString(),
    });
    setPreviousCategories(null);
    setRebalanceRationale('Reversion complete: Restored previous category allocations.');
  };

  const handleToggleVerifyItem = (itemId: string) => {
    const updated: BudgetItem[] = budgetItems.map((item) => {
      if (item.id === itemId) {
        const nextType: 'verified_quote' | 'estimated_assumption' =
          item.type === 'verified_quote' ? 'estimated_assumption' : 'verified_quote';
        const nextStatus: 'contracted' | 'projected' =
          nextType === 'verified_quote' ? 'contracted' : 'projected';
        return {
          ...item,
          type: nextType,
          status: nextStatus,
        };
      }
      return item;
    });

    onUpdateEvent({
      ...currentEvent,
      budgetItems: updated,
      lastUpdated: new Date().toISOString(),
    });
  };

  const categoryEntries = Object.entries(categories) as [CategoryKey, typeof categories[CategoryKey]][];

  return (
    <section id="budget" className="scroll-mt-32 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
              Step 2 • Smart Budgeting
            </span>
            <span className="text-xs text-stone-500 font-medium">Spend Generously on What You Love</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Smart Budget Balance &amp; Peace of Mind
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Spend with complete confidence. We clearly separate what you’ve already booked from what you’re still exploring, keeping your total costs comfortably protected with zero invoice surprises.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SectionQuickActions
            sectionType="budget"
            sectionTitle="Budget"
            currentEvent={currentEvent}
            onUpdateEvent={onUpdateEvent}
          />
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Line Item</span>
          </button>
        </div>
      </div>

      {/* Transparent Estimations Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Ceiling */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Budget Ceiling</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            ${totalCeiling.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Allocated: ${totalAllocated.toLocaleString()}</span>
            <span className={remainingUnallocated === 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
              {remainingUnallocated === 0 ? '100% Balanced' : `$${remainingUnallocated.toLocaleString()} unassigned`}
            </span>
          </div>
          <div 
            className="w-full bg-stone-100 h-2 rounded-full mt-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((totalAllocated / totalCeiling) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Total allocated budget: ${Math.round((totalAllocated / totalCeiling) * 100)}%`}
          >
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((totalAllocated / totalCeiling) * 100))}%` }}
            />
          </div>
        </div>

        {/* Verified Quotes */}
        <div className="bg-white border border-emerald-300/80 rounded-2xl p-5 shadow-xs bg-gradient-to-b from-emerald-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Confirmed &amp; Booked
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Locked In
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">
            ${verifiedQuotesTotal.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{Math.round((verifiedQuotesTotal / totalCeiling) * 100)}% of budget</span>
            <span className="text-stone-700 font-medium">{budgetItems.filter(b => b.type === 'verified_quote').length} verified bookings</span>
          </div>
          <div 
            className="w-full bg-stone-100 h-2 rounded-full mt-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((verifiedQuotesTotal / totalCeiling) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confirmed bookings: ${Math.round((verifiedQuotesTotal / totalCeiling) * 100)}% of ceiling`}
          >
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((verifiedQuotesTotal / totalCeiling) * 100))}%` }}
            />
          </div>
        </div>

        {/* Estimated Assumptions */}
        <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-xs bg-gradient-to-b from-amber-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" />
              Estimates &amp; Ideas
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Exploring
            </span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">
            ${estimatedAssumptionsTotal.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{Math.round((estimatedAssumptionsTotal / totalCeiling) * 100)}% of budget</span>
            <span className="text-stone-700 font-medium">{budgetItems.filter(b => b.type === 'estimated_assumption').length} planned items</span>
          </div>
          <div 
            className="w-full bg-stone-100 h-2 rounded-full mt-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((estimatedAssumptionsTotal / totalCeiling) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Estimated planned items: ${Math.round((estimatedAssumptionsTotal / totalCeiling) * 100)}% of ceiling`}
          >
            <div 
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((estimatedAssumptionsTotal / totalCeiling) * 100))}%` }}
            />
          </div>
        </div>

        {/* Contingency Buffer */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              Peace-of-Mind Buffer
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
              {Math.round((contingencyBuffer / totalCeiling) * 100)}% Protected
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-2">
            ${contingencyBuffer.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Safety reserve buffer</span>
            <span className="text-emerald-700 font-semibold">$0 spent (Safe)</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Interactive Rebalancing Simulator Panel */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Interactive Budget Balancer</h3>
              <p className="text-xs text-stone-500">
                Gently adjust any category to see how other areas balance seamlessly without breaking your overall peace of mind.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequestAiAssistance(`Analyze my budget rebalance for ${currentEvent.name}. How do my allocations match my priorities?`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Budget Guidance</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Target Category</label>
            <select
              aria-label="Target Category to Adjust"
              value={rebalanceCategory}
              onChange={(e) => setRebalanceCategory(e.target.value as CategoryKey)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:outline-none"
            >
              {categoryEntries.map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label} (Current: ${c.allocated.toLocaleString()} • Rank #{currentEvent.priorityMatrix[k]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Quick Balance Adjustments</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleExecuteRebalance(rebalanceCategory, 1000)}
                className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                +$1,000
              </button>
              <button
                onClick={() => handleExecuteRebalance(rebalanceCategory, 2500)}
                className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                +$2,500
              </button>
              <button
                onClick={() => handleExecuteRebalance(rebalanceCategory, -1000)}
                className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                -$1,000
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Custom Adjustment ($)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="250"
                value={rebalanceAmountDelta}
                onChange={(e) => setRebalanceAmountDelta(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-bold"
              />
              <button
                onClick={() => handleExecuteRebalance(rebalanceCategory, rebalanceAmountDelta)}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {rebalanceRationale && (
          <div className="p-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-xs text-stone-800 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              📊 <strong>Trade-Off Result:</strong> {rebalanceRationale}
            </div>
            {previousCategories && (
              <button
                onClick={handleUndoRebalance}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 shadow-2xs transition cursor-pointer shrink-0"
                title="Undo last rebalance and restore previous allocations (Norman Principle: Error Recovery)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Undo Rebalance</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Allocations Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Core Budget Categories &amp; Spend Health</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryEntries.map(([key, cat]) => {
            const priorityRank = currentEvent.priorityMatrix[key] || 3;
            const spentPercentage = Math.round((cat.spent / (cat.allocated || 1)) * 100);
            const isOverAllocated = cat.spent > cat.allocated;

            return (
              <div
                key={key}
                className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-stone-300 transition group flex flex-col justify-between"
              >
                {/* Category Relative Photo Header */}
                <div className="relative h-28 w-full overflow-hidden bg-stone-100">
                  <img
                    src={CATEGORY_IMAGES[key] || CATEGORY_IMAGES.venue}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== IMAGES.venue) {
                        target.src = IMAGES.venue;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex items-end justify-between p-3 text-white">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        priorityRank === 1 ? 'bg-amber-400 text-stone-950' : 'bg-white/90 text-stone-900'
                      }`}>
                        #{priorityRank}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight drop-shadow-xs">{cat.label}</h4>
                    </div>
                    <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{cat.rationale}</p>

                <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400">Allocated</span>
                    <div className="text-base font-bold text-stone-900">
                      ${cat.allocated.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400">Committed / Spent</span>
                    <div className={`text-base font-bold ${isOverAllocated ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ${cat.spent.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Spend Progress</span>
                    <span className={isOverAllocated ? 'text-rose-700 font-bold' : ''}>
                      {spentPercentage}%
                    </span>
                  </div>
                  <div 
                    className="w-full bg-stone-100 h-2 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.min(100, spentPercentage)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cat.label} spend: ${spentPercentage}% of allocation`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverAllocated ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, spentPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Structured Budget Line Items Table */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Stateful Budget Ledger</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified contractual commitments vs working estimated projections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Type */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition font-medium ${filterType === 'all' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
              >
                All ({budgetItems.length})
              </button>
              <button
                onClick={() => setFilterType('verified_quote')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${filterType === 'verified_quote' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </button>
              <button
                onClick={() => setFilterType('estimated_assumption')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${filterType === 'estimated_assumption' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <FileText className="w-3 h-3 text-amber-600" />
                Assumptions
              </button>
            </div>

            {/* Filter by Category */}
            <select
              aria-label="Filter line items by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs text-stone-700 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categoryEntries.map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-3">Item / Service Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Estimation Integrity</th>
                <th className="py-3 px-3">Vendor / Notes</th>
                <th className="py-3 px-3 text-right">Cost ($)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-stone-900">
                    {item.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md text-[11px] font-medium border border-stone-200/60">
                      {categories[item.category]?.label || item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVerifyItem(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer hover:shadow-2xs ${
                        item.type === 'verified_quote'
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                      title="Click to toggle estimation integrity (Verified Contract vs Working Estimate)"
                    >
                      {item.type === 'verified_quote' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Quote</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-amber-600" />
                          <span>Estimated Assumption</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-stone-500 max-w-xs truncate">
                    {item.vendorRef && (
                      <span className="font-bold text-stone-800 mr-1">
                        [{item.vendorRef}]
                      </span>
                    )}
                    {item.notes || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-stone-900">
                    ${item.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleVerifyItem(item.id)}
                        className="text-[10px] font-bold text-stone-500 hover:text-stone-900 px-2 py-0.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition cursor-pointer"
                        title={item.type === 'verified_quote' ? 'Change to Estimate' : 'Verify as Quote'}
                      >
                        {item.type === 'verified_quote' ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 transition cursor-pointer p-1"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400 text-xs">
                    No budget line items match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Line Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Add Budget Item
              </h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Category</label>
                <select
                  aria-label="New Line Item Category"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as CategoryKey)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                >
                  {categoryEntries.map(([k, c]) => (
                    <option key={k} value={k}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Item / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Cake & Dessert Station"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Estimation Type</label>
                  <select
                    aria-label="Estimation Type"
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    <option value="estimated_assumption">Estimated Assumption</option>
                    <option value="verified_quote">Verified Contract Quote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Vendor Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sweet Artistry Bakery"
                  value={newItemVendor}
                  onChange={(e) => setNewItemVendor(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Notes / Scope Terms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes delivery, setup and 3-tier tasting box."
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Add to Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
