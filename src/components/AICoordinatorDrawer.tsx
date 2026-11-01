import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { EventState, ChatMessage } from '../types/event';
import { useModalA11y } from '../hooks/useModalA11y';
import { IMAGES } from '../assets/images';
import { AIMessageRenderer } from './AIMessageRenderer';

interface AICoordinatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: EventState;
  onTriggerEventAction?: (actionType: string, payload?: any) => void;
}

export const AICoordinatorDrawer: React.FC<AICoordinatorDrawerProps> = ({
  isOpen,
  onClose,
  currentEvent,
  onTriggerEventAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I'm **Sarah**, your personal celebration concierge and planner. I'm here to ensure organizing **${currentEvent.name}** feels completely joyful, transparent, and calm.

Here is a quick snapshot of where your celebration stands:

| Planning Category | Current Goal & Value | Status |
| :--- | :--- | :--- |
| **Occasion** | ${currentEvent.name} (${currentEvent.type}) | Active Blueprint |
| **Budget Ceiling** | $${currentEvent.budgetCeiling.toLocaleString()} (~$${Math.round(currentEvent.budgetCeiling / currentEvent.guestCount)} / guest) | Under Watch |
| **Target Date** | ${currentEvent.targetDate} | On Schedule |
| **Guest Target** | ${currentEvent.guestCount} loved ones | Target Confirmed |

> 💡 **Concierge Tip:** In my experience, locking in your venue and catering style first protects up to 65% of your total budget from unexpected inflation down the road.

> 🎯 **Next Milestones:** Tell me what brings you the most joy when picturing the day—delicious dining, breathtaking scenery, timeless photos, or live music? I'll instantly craft a balanced plan around what matters to you.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionPrompts: [
        'Prioritize: 1. Catering > 2. Venue > 3. Photo > 4. Decor',
        'Audit my budget for hidden fees',
        'What is currently blocking my timeline?',
        'How do we welcome +25 extra guests smoothly?'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          eventContext: currentEvent,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Server error communicating with EventOS AI');
      }

      const data = await response.json();
      const replyContent = data.reply || data.fallback || 'I have analyzed your event constraints.';

      const extractedActionSteps: string[] = [];
      const lines = replyContent.split('\n');
      let isNextStepSection = false;
      for (const line of lines) {
        if (line.toLowerCase().includes('actionable next step') || line.toLowerCase().includes('next steps')) {
          isNextStepSection = true;
          continue;
        }
        if (isNextStepSection && /^\d+\.\s|^\-\s/.test(line.trim())) {
          const cleanStep = line
            .replace(/^\d+\.\s*|^\-\s*/, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .trim();
          if (cleanStep.length > 5 && cleanStep.length < 90) {
            extractedActionSteps.push(cleanStep);
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPrompts: extractedActionSteps.length > 0 ? extractedActionSteps.slice(0, 3) : [
          'Review dynamic budget allocations',
          'Check unblocked roadmap tasks',
          'Simulate guest count trade-off'
        ]
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I've prepared a personalized budget benchmark for **${currentEvent.name}** based on your target numbers:

| Planning Category | Allocated ($) | Share (%) | Status | Planner's Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Catering** | $${currentEvent.categories.catering.allocated.toLocaleString()} | ${currentEvent.categories.catering.percentage}% | [Contracted] | Prioritized meal & beverage benchmark (~$${Math.round(currentEvent.categories.catering.allocated / currentEvent.guestCount)}/guest) |
| **Venue** | $${currentEvent.categories.venue.allocated.toLocaleString()} | ${currentEvent.categories.venue.percentage}% | [Deposit Paid] | Grounds access, tables & suites covered |
| **Photography** | $${currentEvent.categories.entertainmentMedia.allocated.toLocaleString()} | ${currentEvent.categories.entertainmentMedia.percentage}% | [Reviewed] | Full-day documentary coverage & digital rights |
| **Decor & Florals** | $${currentEvent.categories.decor.allocated.toLocaleString()} | ${currentEvent.categories.decor.percentage}% | [Projected] | Centerpieces, lighting & arch florals |
| **Contingency Buffer** | $${currentEvent.categories.contingency.allocated.toLocaleString()} | ${currentEvent.categories.contingency.percentage}% | [Reserved] | Dedicated safety net for peace of mind |

> 💡 **Concierge Tip:** Keeping a 10% contingency buffer reserved early prevents last-minute stress over delivery tips, overtime hours, or weather modifications.

> ⚠️ **Watch Out For:** Service charges on catering invoices (often 20–24%) are administrative fees, not waitstaff gratuity. Clarify this early with your caterer!

### Next Steps for You
1. Finalize catering dietary headcounts to unblock formal invitations.
2. Confirm venue load-in hours and the 10:00 PM music ordinance with your site manager.
3. Lock in your second photographer coverage hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPrompts: [
          'Finalize catering dietary count',
          'Verify venue sound curfew',
          'Audit contingency reserve'
        ]
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-reset',
        role: 'assistant',
        content: `I've refreshed our workspace for **"${currentEvent.name}"**! 

> 💡 **Concierge Tip:** Whenever you're ready, tell me about your budget target, guest count, or top priorities, and I'll generate custom allocation tables and trade-off strategies tailored just for you.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPrompts: [
          'Budget: $35k, 120 guests, Catering #1',
          'Audit my budget for hidden fees',
          'What is currently blocking my timeline?'
        ]
      }
    ]);
  };

  const drawerRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div 
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coordinator-drawer-title"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-white border-l border-stone-200 shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-200 text-stone-900"
    >
      {/* Top Header */}
      <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={IMAGES.avatarCoordinator}
            alt="Sarah Jenkins - Celebration Concierge"
            className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-2xs shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 id="coordinator-drawer-title" className="text-sm font-bold text-stone-900">Sarah Jenkins · Celebration Concierge</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Currently Planning: {currentEvent.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            title="Reset Chat Session"
            aria-label="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition cursor-pointer"
            title="Close Drawer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-stone-900 text-white font-medium rounded-tr-xs shadow-xs'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs shadow-xs space-y-2'
                }`}
              >
                <div className="break-words">
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <AIMessageRenderer content={msg.content} onActionClick={handleSendMessage} />
                  )}
                </div>

                <div className={`text-[10px] text-right mt-1.5 ${isUser ? 'text-stone-300' : 'text-stone-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* Actionable Next Steps Chips */}
              {!isUser && msg.actionPrompts && msg.actionPrompts.length > 0 && (
                <div className="mt-2 pl-1 flex flex-wrap gap-1.5 max-w-[92%]">
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 w-full mb-0.5">
                    <Lightbulb className="w-3 h-3 text-amber-600" /> Actionable Next Steps:
                  </span>
                  {msg.actionPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1 rounded-xl border border-stone-200/90 transition cursor-pointer text-left shadow-2xs font-medium"
                    >
                      → {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-stone-200 rounded-2xl text-xs text-stone-600 w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Sarah is finding thoughtful solutions for you...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starters */}
      <div className="px-4 py-2 bg-stone-100 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleSendMessage('Total budget $35,000, 120 guests. Priorities: Catering #1, Venue #2, Photo #3, Decor #4. Suggest my ideal budget balance.')}
          className="text-[10px] bg-white text-stone-700 hover:text-stone-900 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer border border-stone-200 font-semibold shadow-2xs"
        >
          Balance $35k Budget
        </button>
        <button
          onClick={() => handleSendMessage('Check my celebration budget for surprise extra fees or tips')}
          className="text-[10px] bg-white text-stone-700 hover:text-stone-900 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer border border-stone-200 font-semibold shadow-2xs"
        >
          Check Surprise Fees
        </button>
        <button
          onClick={() => handleSendMessage('What is the best next step to take on my celebration timeline?')}
          className="text-[10px] bg-white text-stone-700 hover:text-stone-900 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer border border-stone-200 font-semibold shadow-2xs"
        >
          Next Timeline Step
        </button>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3.5 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Sarah anything or describe what you envision..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4 text-amber-400" />
          </button>
        </form>
      </div>
    </div>
  );
};
