/**
 * @file App.tsx
 * @description Root application component for Celebration Studio.
 *
 * Responsibilities:
 * - Manages the global event list and the currently active event.
 * - Controls the top-level view (landing ↔ studio).
 * - Persists event state to `localStorage` via `useLocalStorage`.
 * - Tracks the active studio section via `useScrollSpy`.
 * - Lazy-loads heavy workflow chunks (code-splitting for performance).
 */

import React, { useState, lazy, Suspense } from 'react';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY, SAMPLE_GALA } from './data/sampleEvents';
import type { EventState } from './types/event';
import { Header } from './components/Header';
import { ScrollProgressBar } from './components/ScrollProgress';
import { FadeInOnScroll } from './components/FadeInOnScroll';
import { NormanPrinciplesGuide } from './components/NormanPrinciplesGuide';
import { Bot, Sparkles, ArrowUp, Home } from 'lucide-react';
import { resolveVendorImage } from './assets/images';
import { HelmetProvider } from 'react-helmet-async';
import { EventSEO } from './components/EventSEO';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  STORAGE_DEBOUNCE_MS,
  SCROLL_AFTER_TRANSITION_MS,
} from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useScrollSpy } from './hooks/useScrollSpy';

// ---------------------------------------------------------------------------
// Code-split route & workflow chunks
// (Each import() resolves only when that section first scrolls into view)
// ---------------------------------------------------------------------------
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const DiscoveryWorkflow = lazy(() =>
  import('./components/DiscoveryWorkflow').then((m) => ({ default: m.DiscoveryWorkflow })),
);
const BudgetWorkflow = lazy(() =>
  import('./components/BudgetWorkflow').then((m) => ({ default: m.BudgetWorkflow })),
);
const TimelineWorkflow = lazy(() =>
  import('./components/TimelineWorkflow').then((m) => ({ default: m.TimelineWorkflow })),
);
const ScenarioWorkflow = lazy(() =>
  import('./components/ScenarioWorkflow').then((m) => ({ default: m.ScenarioWorkflow })),
);
const VendorWorkflow = lazy(() =>
  import('./components/VendorWorkflow').then((m) => ({ default: m.VendorWorkflow })),
);
const AICoordinatorDrawer = lazy(() =>
  import('./components/AICoordinatorDrawer').then((m) => ({ default: m.AICoordinatorDrawer })),
);
const OnboardingModal = lazy(() =>
  import('./components/OnboardingModal').then((m) => ({ default: m.OnboardingModal })),
);
const ExportModal = lazy(() =>
  import('./components/ExportModal').then((m) => ({ default: m.ExportModal })),
);

// ---------------------------------------------------------------------------
// Shared Suspense fallback (animated skeleton)
// ---------------------------------------------------------------------------

/** Animated placeholder shown while a lazy workflow chunk is loading. */
const ComponentFallback: React.FC = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center space-y-3 bg-white/70 rounded-3xl border border-stone-200/80 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-amber-600 animate-ping" />
    </div>
    <span className="text-xs font-semibold text-stone-500">Loading celebration workspace…</span>
  </div>
);

// ---------------------------------------------------------------------------
// Prop-less animation wrapper — shared defaults keep JSX concise
// ---------------------------------------------------------------------------

/** Props for the studio-section animation wrapper. */
interface SectionWrapProps {
  children: React.ReactNode;
}

/** Standard fade-in-on-scroll wrapper used for every studio section card. */
const SectionWrap: React.FC<SectionWrapProps> = ({ children }) => (
  <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale blur>
    {children}
  </FadeInOnScroll>
);

// ---------------------------------------------------------------------------
// Helper: normalise legacy cached vendor image paths on hydration
// ---------------------------------------------------------------------------

/**
 * Repairs any stale `/src/assets/images/…` paths that may have been
 * serialised into the v2 localStorage cache.
 *
 * @param events - Raw array parsed from localStorage.
 * @returns Normalised event array with resolved image URLs.
 */
function normaliseCachedEvents(events: EventState[]): EventState[] {
  return events.map((evt) => ({
    ...evt,
    vendors: evt.vendors?.map((v) => ({
      ...v,
      imageUrl: resolveVendorImage(v),
    })),
  }));
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/** Application view mode — either the marketing landing page or the studio. */
type AppView = 'landing' | 'studio';

/**
 * Root component for Celebration Studio.
 *
 * State is co-located here (no global store needed at this scale) and flows
 * downward as props.  Heavy workflow components are lazy-loaded on demand.
 */
export default function App() {
  // ── Persistent event list (debounced localStorage sync) ──────────────────
  const [eventsList, setEventsList] = useLocalStorage<EventState[]>(
    STORAGE_KEY,
    () => {
      // Migration: check legacy key first
      try {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy) as EventState[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return normaliseCachedEvents(parsed);
          }
        }
      } catch {
        // Ignore — fall through to defaults
      }
      return [SAMPLE_WEDDING, SAMPLE_BIRTHDAY, SAMPLE_GALA];
    },
    STORAGE_DEBOUNCE_MS,
  );

  // ── Active event ──────────────────────────────────────────────────────────
  const [activeEventId, setActiveEventId] = useState<string>(
    () => eventsList[0]?.id ?? SAMPLE_WEDDING.id,
  );

  // ── View & modal state ────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // ── Scroll-spy (active section + scroll-to-top FAB visibility) ───────────
  const { activeSection, setActiveSection, showScrollTop } = useScrollSpy(
    currentView === 'studio',
  );

  // ── Derived state ─────────────────────────────────────────────────────────
  const currentEvent =
    eventsList.find((e) => e.id === activeEventId) ?? eventsList[0] ?? SAMPLE_WEDDING;

  // ── Event handlers ────────────────────────────────────────────────────────

  /** Replaces the matching event in the list with an updated version. */
  const handleUpdateCurrentEvent = (updated: EventState) => {
    setEventsList((prev) => prev.map((evt) => (evt.id === updated.id ? updated : evt)));
  };

  /** Prepends a newly created event, switches to it, and enters the studio. */
  const handleSaveNewEvent = (newEvent: EventState) => {
    setEventsList((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    setCurrentView('studio');
    handleNavigateSection('discovery');
  };

  /**
   * Scrolls the studio viewport to the requested section and updates the
   * active section indicator.
   */
  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId as typeof activeSection);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Switches to the studio view and, optionally, scrolls to a target section
   * after a short delay so the DOM has time to mount.
   */
  const handleLaunchStudio = (targetSection?: string) => {
    setCurrentView('studio');
    if (targetSection) {
      setActiveSection(targetSection as typeof activeSection);
      setTimeout(() => {
        document.getElementById(targetSection)?.scrollIntoView({ behavior: 'smooth' });
      }, SCROLL_AFTER_TRANSITION_MS);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Opens the AI coordinator drawer in response to a quick-action prompt.
   * The `prompt` parameter is accepted for future use (pre-filling the input).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRequestAiAssistance = (_prompt: string) => {
    setIsAiDrawerOpen(true);
  };

  /** Smooth-scrolls back to the very top of the page. */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <HelmetProvider>
      <EventSEO
        currentEvent={currentEvent}
        activeSection={activeSection}
        isLanding={currentView === 'landing'}
      />
      <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Reading progress bar (Framer Motion useScroll + useSpring) */}
        <ScrollProgressBar />

        <Suspense fallback={<ComponentFallback />}>
          {currentView === 'landing' ? (
            /* ── 1. Interactive Landing Page ── */
            <LandingPage
              currentEvent={currentEvent}
              eventsList={eventsList}
              onSelectEvent={setActiveEventId}
              onLaunchStudio={handleLaunchStudio}
              onRequestAiAssistance={handleRequestAiAssistance}
            />
          ) : (
            /* ── 2. Full Planning Studio Workspace ── */
            <>
              {/* Sticky top navigation */}
              <Header
                currentEvent={currentEvent}
                eventsList={eventsList}
                onSelectEvent={setActiveEventId}
                onNewEvent={() => setIsOnboardingOpen(true)}
                activeSection={activeSection}
                onNavigateSection={handleNavigateSection}
                isAiDrawerOpen={isAiDrawerOpen}
                setIsAiDrawerOpen={setIsAiDrawerOpen}
                onExportDossier={() => setIsExportOpen(true)}
                onBackToLanding={() => setCurrentView('landing')}
              />

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-20">
                {/* Visually hidden H1 for screen-reader landmark */}
                <h1 className="sr-only">
                  Celebration Studio Planning Workspace — {currentEvent.name}
                </h1>

                {/* Don Norman Design Principles contextual guide */}
                <FadeInOnScroll direction="up" delay={0.02} distance={24} duration={0.6} scale blur={false}>
                  <NormanPrinciplesGuide
                    activeSection={activeSection}
                    onNavigateSection={handleNavigateSection}
                  />
                </FadeInOnScroll>

                {/* Section 1 — Discovery & Core Constraint Intake */}
                <SectionWrap>
                  <DiscoveryWorkflow
                    currentEvent={currentEvent}
                    onUpdateEvent={handleUpdateCurrentEvent}
                    onNavigateSection={handleNavigateSection}
                    onRequestAiAssistance={handleRequestAiAssistance}
                  />
                </SectionWrap>

                {/* Section 2 — Dynamic Budget Allocation & Priority Rebalancing */}
                <SectionWrap>
                  <BudgetWorkflow
                    currentEvent={currentEvent}
                    onUpdateEvent={handleUpdateCurrentEvent}
                    onRequestAiAssistance={handleRequestAiAssistance}
                  />
                </SectionWrap>

                {/* Section 3 — Sequential Timeline & Task Dependency Roadmap */}
                <SectionWrap>
                  <TimelineWorkflow
                    currentEvent={currentEvent}
                    onUpdateEvent={handleUpdateCurrentEvent}
                    onRequestAiAssistance={handleRequestAiAssistance}
                  />
                </SectionWrap>

                {/* Section 4 — Scenario Revision & Domino Trade-Off Engine */}
                <SectionWrap>
                  <ScenarioWorkflow
                    currentEvent={currentEvent}
                    onUpdateEvent={handleUpdateCurrentEvent}
                    onRequestAiAssistance={handleRequestAiAssistance}
                  />
                </SectionWrap>

                {/* Section 5 — Vendor Quotations & Hidden Fee Forensics */}
                <SectionWrap>
                  <VendorWorkflow
                    currentEvent={currentEvent}
                    onUpdateEvent={handleUpdateCurrentEvent}
                    onRequestAiAssistance={handleRequestAiAssistance}
                  />
                </SectionWrap>
              </main>
            </>
          )}
        </Suspense>

        {/* ── Floating Action Controls ── */}
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
          {currentView === 'studio' && (
            <button
              type="button"
              onClick={() => setCurrentView('landing')}
              aria-label="Return to landing page"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-2xl shadow-md text-xs font-bold transition cursor-pointer hover:border-stone-300"
              title="Return to Landing Page"
            >
              <Home className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>
          )}

          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll to top of page"
              className="w-11 h-11 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-2xl shadow-md flex items-center justify-center transition cursor-pointer"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAiDrawerOpen(true)}
            aria-label="Open AI Celebration Advisor"
            className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl shadow-xl transition cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold">Ask Celebration Advisor</span>
          </button>
        </div>

        {/* ── Footer ── */}
        <footer className="bg-white border-t border-stone-200/80 py-8 px-4 sm:px-6 text-center text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">Celebration Studio</span>
              <span aria-hidden="true">—</span>
              <span>Your Personal Celebration Planner &amp; Budget Guardian</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-stone-400 font-medium">
              <span>Genuine Joy Over Stress</span>
              <span aria-hidden="true">•</span>
              <span>Transparent, Honest Pricing</span>
              <span aria-hidden="true">•</span>
              <span>Total Peace of Mind</span>
            </div>
          </div>
        </footer>

        {/* ── Lazy-loaded modals & drawers ── */}
        <Suspense fallback={null}>
          {isAiDrawerOpen && (
            <AICoordinatorDrawer
              isOpen={isAiDrawerOpen}
              onClose={() => setIsAiDrawerOpen(false)}
              currentEvent={currentEvent}
            />
          )}

          {isOnboardingOpen && (
            <OnboardingModal
              isOpen={isOnboardingOpen}
              onClose={() => setIsOnboardingOpen(false)}
              onSaveNewEvent={handleSaveNewEvent}
            />
          )}

          {isExportOpen && (
            <ExportModal
              isOpen={isExportOpen}
              onClose={() => setIsExportOpen(false)}
              currentEvent={currentEvent}
              onRestoreBackup={(restoredEvent) => {
                handleUpdateCurrentEvent(restoredEvent);
                setActiveEventId(restoredEvent.id);
              }}
            />
          )}
        </Suspense>
      </div>
    </HelmetProvider>
  );
}
