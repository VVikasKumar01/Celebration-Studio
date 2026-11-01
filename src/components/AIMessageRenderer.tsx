import React from 'react';
import { Lightbulb, AlertTriangle, Target, CheckCircle2, Sparkles, ArrowRight, Table as TableIcon } from 'lucide-react';

interface AIMessageRendererProps {
  content: string;
  onActionClick?: (actionText: string) => void;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

export const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ content, onActionClick }) => {
  // Parse message into structured blocks: paragraphs, tables, callout cards, next-step lists
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Detect Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const tableData = parseMarkdownTable(tableLines);
      if (tableData) {
        blocks.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-stone-200/90 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {tableData.headers.map((h, idx) => (
                    <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                      {formatInlineText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-stone-50/50 hover:bg-amber-50/40 transition' : 'hover:bg-amber-50/40 transition'}>
                    {row.map((cell, cIdx) => {
                      const isMoney = /\$[\d,]+/.test(cell);
                      const isPercentage = /^\d+(\.\d+)?%$/.test(cell.trim());
                      return (
                        <td key={cIdx} className="py-2 px-3 align-top leading-snug">
                          {isPercentage ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {cell.trim()}
                            </span>
                          ) : isMoney ? (
                            <span className="font-mono font-semibold text-stone-900">
                              {formatInlineText(cell)}
                            </span>
                          ) : (
                            formatInlineText(cell)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Detect Callout Card (starting with > )
    if (trimmed.startsWith('>')) {
      const calloutLines: string[] = [trimmed.replace(/^>\s*/, '')];
      i++;
      while (
        i < lines.length &&
        lines[i].trim().startsWith('>') &&
        !/^[💡⚠️🎯📋✨]/.test(lines[i].trim().replace(/^>\s*/, '')) &&
        !/^\*\*(Concierge Tip|Watch Out|Priority|Tip|Warning)/i.test(lines[i].trim().replace(/^>\s*/, ''))
      ) {
        calloutLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      const calloutText = calloutLines.join(' ');
      const isTip = calloutText.includes('💡') || calloutText.toLowerCase().includes('tip') || calloutText.toLowerCase().includes('insight');
      const isWarning = calloutText.includes('⚠️') || calloutText.toLowerCase().includes('watch out') || calloutText.toLowerCase().includes('risk');
      const isPriority = calloutText.includes('🎯') || calloutText.toLowerCase().includes('priority') || calloutText.toLowerCase().includes('focus');

      let cardStyle = 'bg-amber-50/70 border-amber-200/90 text-amber-950';
      let icon = <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />;
      let badgeLabel = 'Concierge Tip';

      if (isWarning) {
        cardStyle = 'bg-rose-50/70 border-rose-200/90 text-rose-950';
        icon = <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />;
        badgeLabel = 'Watch Out For';
      } else if (isPriority) {
        cardStyle = 'bg-indigo-50/70 border-indigo-200/90 text-indigo-950';
        icon = <Target className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />;
        badgeLabel = 'Priority Strategy';
      }

      blocks.push(
        <div key={`callout-${i}`} className={`my-2.5 p-3.5 rounded-xl border ${cardStyle} shadow-2xs flex items-start gap-2.5`}>
          {icon}
          <div className="text-xs leading-relaxed flex-1">
            <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5 opacity-80">
              {badgeLabel}
            </span>
            {formatInlineText(calloutText.replace(/^[💡⚠️🎯📋✨]\s*/, ''))}
          </div>
        </div>
      );
      continue;
    }

    // 4. Detect Section Headers (### Next Steps / ### Recommendations)
    if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      const isNextSteps = headerText.toLowerCase().includes('next step') || headerText.toLowerCase().includes('action');

      blocks.push(
        <div key={`header-${i}`} className="mt-3.5 mb-1.5 flex items-center gap-1.5">
          {isNextSteps ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
          )}
          <h4 className="text-xs font-bold text-stone-900 tracking-tight">
            {headerText}
          </h4>
        </div>
      );
      i++;
      continue;
    }

    // 5. Detect Numbered Action Steps (1. ..., 2. ...)
    if (/^\d+\.\s/.test(trimmed)) {
      const stepNumber = trimmed.match(/^(\d+)\./)?.[1] || '•';
      const stepText = trimmed.replace(/^\d+\.\s*/, '');

      blocks.push(
        <div key={`step-${i}`} className="my-1.5 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200/80 transition flex items-start justify-between gap-2.5 group">
          <div className="flex items-start gap-2.5 flex-1">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              {stepNumber}
            </span>
            <div className="text-xs text-stone-800 leading-snug pt-0.5">
              {formatInlineText(stepText)}
            </div>
          </div>
          {onActionClick && (
            <button
              onClick={() => onActionClick(stepText.replace(/\*\*.*?\*\*/g, '').slice(0, 70))}
              className="text-[10px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer pt-0.5"
              title="Ask Sarah about this step"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      );
      i++;
      continue;
    }

    // 6. Detect Bullet Lists (- or *)
    if (/^[\-\*]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[\-\*]\s*/, '');
      blocks.push(
        <div key={`bullet-${i}`} className="my-1 flex items-start gap-2 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-2" />
          <div className="text-xs text-stone-800 leading-relaxed">
            {formatInlineText(bulletText)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // 7. Regular Conversational Paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-xs text-stone-800 leading-relaxed my-1.5">
        {formatInlineText(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{blocks}</div>;
};

// Helper: Parse markdown table lines
function parseMarkdownTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  // Split row into cells
  const splitRow = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = splitRow(lines[0]);
  if (!headers || headers.length === 0) return null;

  // Check if second line is separator like |:---|:---|
  const separatorLine = lines[1];
  const isSeparator = /^\|(\s*:?-+:?\s*\|)+$/.test(separatorLine);
  const dataStartIndex = isSeparator ? 2 : 1;

  const rows: string[][] = [];
  for (let idx = dataStartIndex; idx < lines.length; idx++) {
    const cells = splitRow(lines[idx]);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

// Helper: Format inline bolding, status tags, and currency highlights
function formatInlineText(text: string): React.ReactNode {
  // Replace status tags like [Blocked by...], [Pending], [Contracted], [Completed]
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]|`.*?`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-stone-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-800 border border-stone-200">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('[') && part.endsWith(']')) {
          const inner = part.slice(1, -1);
          if (inner.toLowerCase().includes('blocked')) {
            return (
              <span key={index} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 my-0.5 mr-1">
                {part}
              </span>
            );
          }
          if (inner.toLowerCase().includes('completed') || inner.toLowerCase().includes('contracted') || inner.toLowerCase().includes('approved')) {
            return (
              <span key={index} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 my-0.5 mr-1">
                {part}
              </span>
            );
          }
          if (inner.toLowerCase().includes('pending') || inner.toLowerCase().includes('reviewed') || inner.toLowerCase().includes('deposit')) {
            return (
              <span key={index} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 my-0.5 mr-1">
                {part}
              </span>
            );
          }
        }
        return part;
      })}
    </>
  );
}

export default AIMessageRenderer;
