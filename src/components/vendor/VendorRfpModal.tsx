import React, { useState } from 'react';
import { Send, Sparkles, Copy, Check } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { EventState } from '../../types/event';

interface VendorRfpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: EventState;
}

export const VendorRfpModal: React.FC<VendorRfpModalProps> = ({
  isOpen,
  onClose,
  currentEvent,
}) => {
  const [rfpVendorType, setRfpVendorType] = useState('Photographer');
  const [rfpSpecialReqs, setRfpSpecialReqs] = useState('');
  const [isGeneratingRfp, setIsGeneratingRfp] = useState(false);
  const [generatedRfp, setGeneratedRfp] = useState<any>(null);
  const [copiedRfp, setCopiedRfp] = useState(false);

  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRfp(true);
    setTimeout(() => setCopiedRfp(false), 3000);
  };

  const handleGenerateRfp = async () => {
    setIsGeneratingRfp(true);
    setGeneratedRfp(null);

    try {
      const response = await fetch('/api/generate-rfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorType: rfpVendorType,
          eventContext: {
            name: currentEvent.name,
            type: currentEvent.type,
            targetDate: currentEvent.targetDate,
            guestCount: currentEvent.guestCount,
            allocatedAmount: (() => {
              const catMap: Record<string, keyof typeof currentEvent.categories> = {
                'photographer': 'entertainmentMedia',
                'caterer': 'catering',
                'venue': 'venue',
                'florist/decor': 'decor',
                'dj/band': 'entertainmentMedia',
              };
              const mappedKey = catMap[rfpVendorType.toLowerCase()] || 'entertainmentMedia';
              return currentEvent.categories[mappedKey]?.allocated || 0;
            })(),
          },
          specificRequirements: rfpSpecialReqs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rfp) {
          setGeneratedRfp(data.rfp);
          setIsGeneratingRfp(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API RFP fallback:', e);
    }

    setGeneratedRfp({
      inquirySubject: `Inquiry: ${currentEvent.name} — ${currentEvent.targetDate} (${currentEvent.guestCount} Guests)`,
      inquiryEmailBody: `Dear ${rfpVendorType} Team,\n\nWe are currently planning our celebration, "${currentEvent.name}", scheduled for ${currentEvent.targetDate} for approximately ${currentEvent.guestCount} guests. Our target atmosphere is "${currentEvent.vibe}".\n\nWe would love to review your availability and an itemized quotation based on our guest count and event timeline.\n\nCould you please review the attached screening questions and provide a transparent, all-inclusive proposal breakdown including all operations fees, taxes, and overtime terms?\n\nWarm regards,\nEventOS Planning Team`,
      criticalScreeningQuestions: [
        {
          question: 'Are there any mandatory administrative or service fees not included in the base package?',
          whyItMatters: 'Administrative fees often add 20-25% to final invoices and are rarely paid to service staff.',
          redFlagAnswer: 'Quoting a low base price and adding fees only in the final contract draft.',
        },
        {
          question: 'What is your backup protocol and designated replacement in the event of illness or emergency?',
          whyItMatters: 'Guarantees coverage without compromising event execution.',
          redFlagAnswer: 'No designated second shooter or replacement vendor specified in writing.',
        },
        {
          question: 'What are your exact overtime rates and load-out time constraints?',
          whyItMatters: 'Overtime markups often range from $200-$500/hour if party extends.',
          redFlagAnswer: 'Vague overtime statements without fixed hourly caps.',
        },
      ],
      hiddenFeeWatchlist: [
        'Operations or administration charge (ask if it goes to staff)',
        'Breakdown or late-night pickup surcharge after 11 PM',
        'Travel or fuel fee if location is outside primary zone',
      ],
      contractTermsToMandate: [
        'Full digital image delivery timeline (within 6 weeks)',
        'Written refund and rescheduling policy for force majeure',
      ],
    });

    setIsGeneratingRfp(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfp-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-stone-900"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 id="rfp-modal-title" className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            Craft a Friendly Vendor Inquiry
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-lg hover:bg-stone-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rfp-vendor-type" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Creative Partner Type
              </label>
              <select
                id="rfp-vendor-type"
                aria-label="Vendor Inquiry Category"
                value={rfpVendorType}
                onChange={(e) => setRfpVendorType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium"
              >
                <option value="Photographer">Photographer &amp; Media</option>
                <option value="Caterer">Caterer &amp; Bar</option>
                <option value="Venue">Venue</option>
                <option value="Florist/Decor">Florist &amp; Decor</option>
                <option value="DJ/Band">DJ &amp; Live Band</option>
              </select>
            </div>

            <div>
              <label htmlFor="rfp-special-reqs" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Special Touches You Envision (Optional)
              </label>
              <input
                id="rfp-special-reqs"
                type="text"
                placeholder="e.g. 8 hours coverage, 2 shooters, drone photos"
                value={rfpSpecialReqs}
                onChange={(e) => setRfpSpecialReqs(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGenerateRfp}
              disabled={isGeneratingRfp}
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingRfp ? 'Writing Polite Inquiry...' : 'Create Inquiry Message'}</span>
            </button>
          </div>

          {generatedRfp && (
            <div className="mt-4 space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-xs font-bold text-stone-900">Subject: {generatedRfp.inquirySubject}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedRfp.inquiryEmailBody)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 rounded-lg border border-stone-300 transition cursor-pointer shadow-2xs"
                >
                  {copiedRfp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRfp ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Friendly Note to Vendor:
                </label>
                <pre className="text-xs text-stone-800 font-sans whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-stone-200 leading-relaxed">
                  {generatedRfp.inquiryEmailBody}
                </pre>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-1.5">
                  Helpful Questions to Ask Your Vendor:
                </label>
                <div className="space-y-2">
                  {generatedRfp.criticalScreeningQuestions?.map((q: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl text-xs space-y-1 border border-stone-200">
                      <p className="font-bold text-stone-900">Q{i + 1}: {q.question}</p>
                      <p className="text-stone-600 text-[11px]">Why it matters: {q.whyItMatters}</p>
                      <p className="text-rose-700 font-medium text-[11px]">Helpful reminder: {q.redFlagAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
