import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  FileCheck,
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  Plus, 
  Trash2, 
  DollarSign, 
  ShieldCheck,
  Scale,
  Send,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  Info,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { EventState, VendorQuote, VendorFee, ProcurementStatus, VendorCategory } from '../types/event';
import { SectionQuickActions } from './SectionQuickActions';
import { IMAGES, CATEGORY_IMAGE_MAP, resolveVendorImage } from '../assets/images';
import { VendorAuditorModal } from './vendor/VendorAuditorModal';
import { VendorRfpModal } from './vendor/VendorRfpModal';

interface VendorWorkflowProps {
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

export type NormalizedStatus = 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';

export const normalizeStatus = (status?: string): NormalizedStatus => {
  if (!status) return 'Pending';
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'contracted') return 'Approved';
  if (s === 'reviewed' || s === 'under_review') return 'Reviewed';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

export const STATUS_CONFIG: Record<NormalizedStatus, {
  label: NormalizedStatus;
  key: ProcurementStatus;
  description: string;
  badgeClass: string;
  badgeOverlayClass: string;
  pillButtonActiveClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  dotColor: string;
  icon: React.FC<{ className?: string }>;
}> = {
  Pending: {
    label: 'Pending',
    key: 'pending',
    description: 'Awaiting initial quote analysis or vendor response',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    badgeOverlayClass: 'bg-amber-400 text-amber-950 shadow-xs font-bold',
    pillButtonActiveClass: 'bg-amber-500 text-white shadow-xs font-bold border-amber-600',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    bgClass: 'bg-amber-50/70',
    dotColor: 'bg-amber-500',
    icon: Clock,
  },
  Reviewed: {
    label: 'Reviewed',
    key: 'reviewed',
    description: 'Proposal forensically audited; terms and markups verified',
    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300',
    badgeOverlayClass: 'bg-blue-400 text-blue-950 shadow-xs font-bold',
    pillButtonActiveClass: 'bg-blue-600 text-white shadow-xs font-bold border-blue-700',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    bgClass: 'bg-blue-50/70',
    dotColor: 'bg-blue-500',
    icon: Eye,
  },
  Approved: {
    label: 'Approved',
    key: 'approved',
    description: 'Procurement cleared & contract locked into budget',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    badgeOverlayClass: 'bg-emerald-400 text-emerald-950 shadow-xs font-bold',
    pillButtonActiveClass: 'bg-emerald-600 text-white shadow-xs font-bold border-emerald-700',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    bgClass: 'bg-emerald-50/70',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    key: 'rejected',
    description: 'Declined due to excessive hidden fees or scope exclusions',
    badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300',
    badgeOverlayClass: 'bg-rose-400 text-rose-950 shadow-xs font-bold',
    pillButtonActiveClass: 'bg-rose-600 text-white shadow-xs font-bold border-rose-700',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    bgClass: 'bg-rose-50/70',
    dotColor: 'bg-rose-500',
    icon: XCircle,
  },
};

const CATEGORY_DEFAULT_PHOTOS = CATEGORY_IMAGE_MAP;

export interface AuditedVendorData {
  vendorName: string;
  category: VendorCategory;
  baseQuote?: number;
  hiddenFees?: VendorFee[];
  trueTotalCost?: number;
  scopeIncluded?: string[];
  scopeExcludedOrExtra?: string[];
  redFlags?: string[];
  missingDetails?: string[];
  status?: ProcurementStatus;
}

export const VendorWorkflow: React.FC<VendorWorkflowProps> = ({
  currentEvent,
  onUpdateEvent,
  onRequestAiAssistance,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'both' | 'table' | 'cards'>('both');
  const [statusChangeToast, setStatusChangeToast] = useState<{ message: string; type: NormalizedStatus } | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<VendorQuote | null>(null);

  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [isRfpModalOpen, setIsRfpModalOpen] = useState(false);

  const vendors = currentEvent.vendors || [];

  const categories = ['All', 'Venue', 'Catering', 'Photography', 'Decor & Florals', 'Music & DJ'];
  const statusOptions: Array<{ key: string; label: string }> = [
    { key: 'All', label: 'All Statuses' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Reviewed', label: 'Reviewed' },
    { key: 'Approved', label: 'Approved' },
    { key: 'Rejected', label: 'Rejected' },
  ];

  // Pipeline Metrics (memoized)
  const statusCounts = useMemo(() => ({
    Pending: vendors.filter(v => normalizeStatus(v.status) === 'Pending').length,
    Reviewed: vendors.filter(v => normalizeStatus(v.status) === 'Reviewed').length,
    Approved: vendors.filter(v => normalizeStatus(v.status) === 'Approved').length,
    Rejected: vendors.filter(v => normalizeStatus(v.status) === 'Rejected').length,
  }), [vendors]);

  const totalQuotes = vendors.length;
  const approvedPercentage = totalQuotes > 0 ? Math.round((statusCounts.Approved / totalQuotes) * 100) : 0;

  // Filtering (memoized)
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesCategory = activeCategory === 'All' || v.category === activeCategory;
      const matchesStatus = activeStatusFilter === 'All' || normalizeStatus(v.status) === activeStatusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [vendors, activeCategory, activeStatusFilter]);

  const triggerToast = (message: string, type: NormalizedStatus) => {
    setStatusChangeToast({ message, type });
    setTimeout(() => {
      setStatusChangeToast(null);
    }, 3500);
  };

  const handleStatusChange = (vendorId: string, newStatus: NormalizedStatus) => {
    const targetVendor = vendors.find(v => v.id === vendorId);
    if (!targetVendor) return;

    const key = STATUS_CONFIG[newStatus].key;
    const updatedVendors = vendors.map(v => {
      if (v.id === vendorId) {
        return { ...v, status: key };
      }
      return v;
    });

    onUpdateEvent({
      ...currentEvent,
      vendors: updatedVendors,
      lastUpdated: new Date().toISOString(),
    });

    triggerToast(`Updated "${targetVendor.vendorName}" status to ${newStatus}`, newStatus);
  };

  const promptDeleteVendor = (vendorId: string) => {
    const targetVendor = vendors.find(v => v.id === vendorId);
    if (!targetVendor) return;
    setVendorToDelete(targetVendor);
  };

  const handleConfirmDelete = () => {
    if (!vendorToDelete) return;
    const idToRemove = vendorToDelete.id;
    const nameToRemove = vendorToDelete.vendorName;
    setVendorToDelete(null);

    const updatedVendors = vendors.filter(v => v.id !== idToRemove);
    onUpdateEvent({
      ...currentEvent,
      vendors: updatedVendors,
      lastUpdated: new Date().toISOString(),
    });
    triggerToast(`Removed quote for "${nameToRemove}"`, 'Rejected');
  };

  const handleAddAuditedVendor = (auditedData: AuditedVendorData) => {
    const newVendor: VendorQuote = {
      id: `v-${Date.now()}`,
      vendorName: auditedData.vendorName,
      category: auditedData.category,
      baseQuote: auditedData.baseQuote || 5000,
      hiddenFees: auditedData.hiddenFees || [],
      trueTotalCost: auditedData.trueTotalCost || auditedData.baseQuote || 5000,
      scopeIncluded: auditedData.scopeIncluded || ['Full service as per proposal'],
      scopeExcludedOrExtra: auditedData.scopeExcludedOrExtra || [],
      redFlags: auditedData.redFlags || [],
      missingDetails: auditedData.missingDetails || [],
      status: auditedData.status || 'reviewed',
      imageUrl: (auditedData.category && CATEGORY_DEFAULT_PHOTOS[auditedData.category]) || CATEGORY_DEFAULT_PHOTOS['Venue'],
    };

    onUpdateEvent({
      ...currentEvent,
      vendors: [...vendors, newVendor],
      lastUpdated: new Date().toISOString(),
    });

    triggerToast(`Added audited quote for "${newVendor.vendorName}" (${newVendor.status})`, normalizeStatus(newVendor.status));
  };

  return (
    <section id="vendors" className="scroll-mt-32 space-y-8">
      {/* Toast Feedback Notification (Norman's Feedback Principle) */}
      {statusChangeToast && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md bg-white ${
            STATUS_CONFIG[statusChangeToast.type].borderClass
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[statusChangeToast.type].dotColor}`} />
            <span className="text-xs font-bold text-stone-900">{statusChangeToast.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
              Step 5 • Handpicked Vendors &amp; Honest Quotes
            </span>
            <span className="text-xs text-stone-500 font-medium">Clear Quotes &amp; Complete Peace of Mind</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Your Dream Creative Team &amp; Quotes
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Discover, compare, and celebrate your dream creative team. Track every quote across 
            <span className="font-semibold text-amber-800"> Pending</span>, 
            <span className="font-semibold text-blue-800"> Reviewed</span>, 
            <span className="font-semibold text-emerald-800"> Approved</span>, and 
            <span className="font-semibold text-rose-800"> Passed</span> stages while enjoying crystal-clear, honest pricing.
          </p>

          {/* User vs Vendor Clarification Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              <strong>Designed for hosts &amp; couples:</strong> Send friendly inquiries to vendors and verify quotes with total transparency.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <SectionQuickActions
            sectionType="vendors"
            sectionTitle="Vendors"
            currentEvent={currentEvent}
            onUpdateEvent={onUpdateEvent}
          />
          <button
            onClick={() => setIsRfpModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Craft Polite Vendor Inquiry</span>
          </button>

          <button
            onClick={() => setIsAuditorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Verify Quote / Check Fees</span>
          </button>
        </div>
      </div>

      {/* Booking Progress Tracker & Status Metrics Strip */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Booking &amp; Selection Journey
            </h3>
            <p className="text-xs text-stone-500">
              {statusCounts.Approved} of {totalQuotes} vendor partners confirmed &amp; signed ({approvedPercentage}% complete)
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>Comparison Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Showcase Cards</span>
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Split View</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-500" 
            style={{ width: `${totalQuotes > 0 ? (statusCounts.Approved / totalQuotes) * 100 : 0}%` }}
            title={`Approved: ${statusCounts.Approved}`}
          />
          <div 
            className="bg-blue-500 transition-all duration-500" 
            style={{ width: `${totalQuotes > 0 ? (statusCounts.Reviewed / totalQuotes) * 100 : 0}%` }}
            title={`Reviewed: ${statusCounts.Reviewed}`}
          />
          <div 
            className="bg-amber-400 transition-all duration-500" 
            style={{ width: `${totalQuotes > 0 ? (statusCounts.Pending / totalQuotes) * 100 : 0}%` }}
            title={`Pending: ${statusCounts.Pending}`}
          />
          <div 
            className="bg-rose-400 transition-all duration-500" 
            style={{ width: `${totalQuotes > 0 ? (statusCounts.Rejected / totalQuotes) * 100 : 0}%` }}
            title={`Rejected: ${statusCounts.Rejected}`}
          />
        </div>

        {/* Status Count Cards (Clickable to Filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Pending */}
          <button
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'Pending' ? 'All' : 'Pending')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeStatusFilter === 'Pending'
                ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-300'
                : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pending
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-200/80 text-amber-950">
                {statusCounts.Pending}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1">Awaiting review or initial quote</p>
          </button>

          {/* Reviewed */}
          <button
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'Reviewed' ? 'All' : 'Reviewed')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeStatusFilter === 'Reviewed'
                ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-300'
                : 'bg-blue-50/50 border-blue-200 hover:bg-blue-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Reviewed
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-200/80 text-blue-950">
                {statusCounts.Reviewed}
              </span>
            </div>
            <p className="text-[11px] text-blue-800/80 mt-1">Verified &amp; clearly reviewed</p>
          </button>

          {/* Approved */}
          <button
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'Approved' ? 'All' : 'Approved')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeStatusFilter === 'Approved'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Approved
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-200/80 text-emerald-950">
                {statusCounts.Approved}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-1">Confirmed &amp; booked</p>
          </button>

          {/* Rejected */}
          <button
            onClick={() => setActiveStatusFilter(activeStatusFilter === 'Rejected' ? 'All' : 'Rejected')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeStatusFilter === 'Rejected'
                ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-300'
                : 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Passed
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-200/80 text-rose-950">
                {statusCounts.Rejected}
              </span>
            </div>
            <p className="text-[11px] text-rose-800/80 mt-1">Not the right fit for our day</p>
          </button>
        </div>
      </div>

      {/* Category & Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Active Filter Pill Indicator */}
          {activeStatusFilter !== 'All' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
              <span className="text-xs text-stone-500">Status filter:</span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                STATUS_CONFIG[activeStatusFilter as NormalizedStatus]?.badgeClass
              }`}>
                {activeStatusFilter}
                <button 
                  onClick={() => setActiveStatusFilter('All')}
                  className="hover:text-black font-black ml-0.5 cursor-pointer"
                  title="Clear status filter"
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Showing <span className="text-stone-900 font-bold">{filteredVendors.length}</span> of {vendors.length} quotes
        </div>
      </div>

      {/* 1. Dedicated Vendor Quotation Table (Responsive Matrix View) */}
      {(viewMode === 'table' || viewMode === 'both') && (
        <div className="bg-white border border-stone-200/90 rounded-3xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-rose-600" />
                Vendor Quotes &amp; Transparent Comparison
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Compare your creative partners side-by-side with clear status markers and easy updates.
              </p>
            </div>
            <div className="text-xs text-stone-500">
              Click any status button to update your booking progress
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100/70 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="py-3 px-4">Vendor &amp; Category</th>
                  <th className="py-3 px-4 text-right">Base Quote</th>
                  <th className="py-3 px-4 text-right">Extra Costs &amp; Taxes</th>
                  <th className="py-3 px-4 text-right">All-In Total</th>
                  <th className="py-3 px-4 text-center">Booking Status</th>
                  <th className="py-3 px-4 text-center">Update Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-stone-500">
                      No vendor proposals match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const normStatus = normalizeStatus(vendor.status);
                    const config = STATUS_CONFIG[normStatus];
                    const StatusIcon = config.icon;
                    const hiddenFeeSum = vendor.hiddenFees.reduce((acc, f) => acc + f.estimatedCost, 0);
                    const hiddenPercentage = Math.round((hiddenFeeSum / (vendor.baseQuote || 1)) * 100);

                    return (
                      <tr 
                        key={vendor.id} 
                        className={`hover:bg-stone-50/80 transition-colors ${
                          normStatus === 'Approved'
                            ? 'bg-emerald-50/20'
                            : normStatus === 'Rejected'
                            ? 'bg-rose-50/20 opacity-90'
                            : ''
                        }`}
                      >
                        {/* Vendor Name & Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveVendorImage(vendor)}
                              alt={vendor.vendorName}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = (vendor.category && CATEGORY_IMAGE_MAP[vendor.category]) || IMAGES.venue;
                                if (target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                            />
                            <div>
                              <span className="font-bold text-stone-900 block text-xs">
                                {vendor.vendorName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                                  {vendor.category}
                                </span>
                                {vendor.redFlags.length > 0 && (
                                  <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-0.5" title={vendor.redFlags.join(', ')}>
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    {vendor.redFlags.length} Flag{vendor.redFlags.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Base Advertised Quote */}
                        <td className="py-3.5 px-4 text-right font-medium text-stone-600">
                          ${vendor.baseQuote.toLocaleString()}
                        </td>

                        {/* Hidden Fees */}
                        <td className="py-3.5 px-4 text-right">
                          {hiddenFeeSum > 0 ? (
                            <div className="inline-block text-right">
                              <span className="font-bold text-rose-700">
                                +${hiddenFeeSum.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-rose-600 block">
                                (+{hiddenPercentage}% unbundled)
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Transparent
                            </span>
                          )}
                        </td>

                        {/* True Forensic Total */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-black text-stone-900 text-sm tabular-nums">
                            ${vendor.trueTotalCost.toLocaleString()}
                          </span>
                        </td>

                        {/* Visual Status Indicator (Badge with Icon and Pulse Dot) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <span 
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs ${config.badgeClass}`}
                              title={config.description}
                            >
                              <span className={`w-2 h-2 rounded-full ${config.dotColor} ${normStatus === 'Pending' ? 'animate-pulse' : ''}`} />
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{config.label}</span>
                            </span>
                          </div>
                        </td>

                        {/* Interactive Status Changer Pills (Don Norman Affordance & Feedback) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 gap-1">
                            {(['Pending', 'Reviewed', 'Approved', 'Rejected'] as NormalizedStatus[]).map((status) => {
                              const isCurrent = normStatus === status;
                              const statConfig = STATUS_CONFIG[status];
                              const StatIcon = statConfig.icon;
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(vendor.id, status)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                    isCurrent
                                      ? statConfig.pillButtonActiveClass
                                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                                  }`}
                                  title={`Switch status to ${status}`}
                                >
                                  <StatIcon className="w-3 h-3" />
                                  <span className="hidden lg:inline">{status}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Delete / Quick Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => promptDeleteVendor(vendor.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title={`Remove quote for ${vendor.vendorName}`}
                            aria-label={`Remove quote for ${vendor.vendorName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Side-by-Side Detailed Vendor Cards Grid */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <div className="space-y-4">
          {viewMode === 'both' && (
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                Detailed Quote Breakdown &amp; What's Included
              </h3>
              <span className="text-xs text-stone-500">
                Explore what is included, extra services, and reassuring advice
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVendors.map((vendor) => {
              const normStatus = normalizeStatus(vendor.status);
              const config = STATUS_CONFIG[normStatus];
              const StatusIcon = config.icon;
              const hiddenFeeSum = vendor.hiddenFees.reduce((acc, f) => acc + f.estimatedCost, 0);
              const hiddenPercentage = Math.round((hiddenFeeSum / (vendor.baseQuote || 1)) * 100);

              return (
                <div
                  key={vendor.id}
                  className={`bg-white border rounded-3xl p-6 shadow-xs space-y-4 transition ${
                    normStatus === 'Approved'
                      ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white'
                      : normStatus === 'Rejected'
                      ? 'border-rose-300 bg-gradient-to-b from-rose-50/20 to-white opacity-90'
                      : normStatus === 'Reviewed'
                      ? 'border-blue-300 bg-gradient-to-b from-blue-50/20 to-white'
                      : 'border-amber-200/90 bg-gradient-to-b from-amber-50/20 to-white hover:border-amber-300'
                  }`}
                >
                  {/* Card Relative Photo Banner */}
                  <div className="relative h-44 sm:h-48 -mx-6 -mt-6 rounded-t-3xl overflow-hidden bg-stone-100 group">
                    <img
                      src={resolveVendorImage(vendor)}
                      alt={`${vendor.vendorName} - ${vendor.category}`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = (vendor.category && CATEGORY_IMAGE_MAP[vendor.category]) || IMAGES.venue;
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent flex flex-col justify-between p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-stone-900 shadow-xs border border-white/40">
                          {vendor.category}
                        </span>

                        {/* Top Overlay Visual Status Indicator Badge */}
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full backdrop-blur-md ${config.badgeOverlayClass}`}>
                          <span className={`w-2 h-2 rounded-full ${config.dotColor} ${normStatus === 'Pending' ? 'animate-pulse' : ''}`} />
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-xs">
                          {vendor.vendorName}
                        </h3>
                        <span className="text-xs text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {config.description}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Overview Strip */}
                  <div className="flex items-center justify-between pb-1 pt-1 border-b border-stone-100">
                    <span className="text-xs font-semibold text-stone-500">All-In Estimated Total:</span>
                    <span className="text-xl font-black text-stone-900 tabular-nums">
                      ${vendor.trueTotalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* Base Cost vs Hidden Fees Comparison Strip */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Base Advertised Quote:</span>
                      <span className="font-bold text-stone-900">${vendor.baseQuote.toLocaleString()}</span>
                    </div>

                    {vendor.hiddenFees.length > 0 && (
                      <div className="pt-2 border-t border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-rose-700 font-bold">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Extra Costs, Tips &amp; Taxes:
                          </span>
                          <span>+${hiddenFeeSum.toLocaleString()} (+{hiddenPercentage}%)</span>
                        </div>

                        <div className="space-y-1 pl-4">
                          {vendor.hiddenFees.map((fee, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-stone-600">
                              <span>{fee.name} ({fee.amountOrRate})</span>
                              <span className="text-stone-900 font-semibold">${fee.estimatedCost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scope Included vs Excluded */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Included in Package:
                      </span>
                      <ul className="space-y-1">
                        {vendor.scopeIncluded.map((item, i) => (
                          <li key={i} className="text-stone-600 text-[11px] leading-tight">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Optional Extras &amp; Add-Ons:
                      </span>
                      <ul className="space-y-1">
                        {vendor.scopeExcludedOrExtra.map((item, i) => (
                          <li key={i} className="text-stone-500 text-[11px] leading-tight">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Red Flags & Missing Details Alert */}
                  {vendor.redFlags.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-rose-900 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Things to Clarify with Vendor:
                      </span>
                      <ul className="space-y-0.5 text-rose-800 text-[11px]">
                        {vendor.redFlags.map((flag, i) => (
                          <li key={i}>⚠️ {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card Bottom Status Switcher */}
                  <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Booking Stage:
                    </span>
                    <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 gap-1 w-full sm:w-auto justify-between sm:justify-start">
                      {(['Pending', 'Reviewed', 'Approved', 'Rejected'] as NormalizedStatus[]).map((status) => {
                        const isCurrent = normStatus === status;
                        const statConfig = STATUS_CONFIG[status];
                        const StatIcon = statConfig.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(vendor.id, status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isCurrent
                                ? statConfig.pillButtonActiveClass
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                            }`}
                            title={`Set status to ${status}`}
                          >
                            <StatIcon className="w-3.5 h-3.5" />
                            <span>{status}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forensic Proposal Auditor Modal (with Document Upload) */}
      <VendorAuditorModal
        isOpen={isAuditorModalOpen}
        onClose={() => setIsAuditorModalOpen(false)}
        budgetCeiling={currentEvent.budgetCeiling}
        onAddAuditedVendor={handleAddAuditedVendor}
      />

      {/* Tailored Vendor Inquiry & RFP Generator Modal */}
      <VendorRfpModal
        isOpen={isRfpModalOpen}
        onClose={() => setIsRfpModalOpen(false)}
        currentEvent={currentEvent}
      />

      {/* Accessible Vendor Deletion Dialog (Norman's Error Recovery & Safety) */}
      {vendorToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-vendor-title"
          aria-describedby="delete-vendor-desc"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 id="delete-vendor-title" className="text-base font-bold text-stone-900">
                  Remove Vendor Quote?
                </h4>
                <p id="delete-vendor-desc" className="text-xs text-stone-600 leading-relaxed">
                  Are you sure you want to remove the proposal for <strong className="text-stone-900 font-semibold">{vendorToDelete.vendorName}</strong> ({vendorToDelete.category})? This will remove its figures from comparison tables.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                onClick={() => setVendorToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Yes, Remove Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
