import React, { useState, useRef } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Printer, 
  X, 
  FileText, 
  Sparkles,
  UploadCloud,
  Database,
  AlertCircle
} from 'lucide-react';
import { EventState } from '../types/event';
import { useModalA11y } from '../hooks/useModalA11y';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: EventState;
  onRestoreBackup?: (restoredEvent: EventState) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentEvent,
  onRestoreBackup,
}) => {
  const [copied, setCopied] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const totalSpent = Object.values(currentEvent.categories).reduce((acc, c) => acc + c.spent, 0);

  const markdownContent = `# Celebration Studio — Your Master Celebration Plan & Summary
**Created On:** ${new Date().toLocaleDateString()}
**Celebration:** ${currentEvent.name}
**Type:** ${currentEvent.type}
**Atmosphere & Feeling:** ${currentEvent.vibe}

---

## 1. Celebration Vision & Guest Details
- **Target Celebration Date:** ${currentEvent.targetDate}
- **Expected Loved Ones & Guests:** ${currentEvent.guestCount}
- **Total Planned Budget:** $${currentEvent.budgetCeiling.toLocaleString()}
- **Planned Investment per Guest:** $${Math.round(currentEvent.budgetCeiling / currentEvent.guestCount)}
- **Dietary & Allergies:** ${(currentEvent.specialFactors.dietaryNuances || []).join(', ')}
- **Accessibility:** ${currentEvent.specialFactors.accessibilityNeeds}
- **Venue Notes:** ${currentEvent.specialFactors.venueRestrictions}

---

## 2. Budget Plan & Spend Overview
| Category | Budgeted ($) | Spent / Confirmed ($) | Share (%) | Priority Rank | Atmosphere Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
${Object.values(currentEvent.categories).map(c => `| **${c.label}** | $${c.allocated.toLocaleString()} | $${c.spent.toLocaleString()} | ${c.percentage}% | #${c.priorityRank} | ${c.rationale} |`).join('\n')}

**Budget Summary:**
- Total Planned: $${Object.values(currentEvent.categories).reduce((a, b) => a + b.allocated, 0).toLocaleString()}
- Total Spent / Booked: $${totalSpent.toLocaleString()}
- Peace of Mind Contingency: $${currentEvent.categories.contingency?.allocated.toLocaleString()} (Protected)

---

## 3. Seamless Day-Of Timeline & Milestones
| Milestone | Status | Celebration Task | Category | Prior Step | Target Date |
| :--- | :--- | :--- | :--- | :--- | :--- |
${currentEvent.tasks.map(t => {
  const statusTag = t.status === 'completed' ? '[Done]' : t.status === 'blocked' ? '[Pending Step]' : '[Coming Up]';
  const prereqs = t.dependsOn && t.dependsOn.length > 0 ? t.dependsOn.join(', ') : 'Ready to start';
  return `| ${t.milestone} | ${statusTag} | ${t.title} | ${t.category} | ${prereqs} | ${t.dueDate} |`;
}).join('\n')}

---

## 4. Handpicked Vendors & Honest Quotes
${currentEvent.vendors.map(v => `
### ${v.vendorName} (${v.category})
- **Status:** [${v.status.toUpperCase()}]
- **Base Advertised Quote:** $${v.baseQuote.toLocaleString()}
- **All-In Estimated Total:** $${v.trueTotalCost.toLocaleString()}
- **Extra Costs & Taxes:** ${v.hiddenFees.map(f => `${f.name} (${f.amountOrRate})`).join(', ') || 'None disclosed'}
- **Included in Package:** ${v.scopeIncluded.join('; ')}
- **Helpful Clarifications:** ${v.redFlags.join('; ') || 'All clear'}
`).join('\n')}

---

*Crafted with love by Celebration Studio — Your Personal Celebration Planner & Budget Guardian.*
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentEvent.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_celebration_plan.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentEvent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentEvent.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_full_blueprint_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && parsed.id && parsed.categories && parsed.budgetCeiling && onRestoreBackup) {
          onRestoreBackup(parsed);
          setRestoreMessage(`Successfully restored blueprint: "${parsed.name}"`);
          setTimeout(() => {
            setRestoreMessage(null);
            onClose();
          }, 2000);
        } else {
          setRestoreError('Invalid blueprint file. Please upload an exported celebration JSON backup.');
        }
      } catch (err) {
        setRestoreError('Could not read JSON backup file. Ensure the file is not corrupted.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-stone-900"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-stone-900">Export &amp; Backup Your Celebration</h2>
              <p className="text-xs text-stone-500">Share with loved ones, print vendor dossiers, or download a full portable backup.</p>
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

        {restoreMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{restoreMessage}</span>
          </div>
        )}

        {restoreError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-600 font-medium">Export options for "{currentEvent.name}":</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              title="Download human-readable Markdown summary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dossier (.md)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              title="Download complete portable JSON backup for cross-device transfer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreJsonFile}
              className="hidden"
            />

            {onRestoreBackup && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition cursor-pointer shadow-2xs"
                title="Restore from a previously saved .json backup"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Restore Backup</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-stone-200 font-mono text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
          {markdownContent}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
