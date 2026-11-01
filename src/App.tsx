import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY, SAMPLE_GALA } from './data/sampleEvents';
import { EventState } from './types/event';
import { Header } from './components/Header';
import { ScrollProgressBar } from './components/ScrollProgress';
import { FadeInOnScroll } from './components/FadeInOnScroll';
import { NormanPrinciplesGuide } from './components/NormanPrinciplesGuide';
import { Bot, Sparkles, ArrowUp, Home } from 'lucide-react';
import { resolveVendorImage } from './assets/images';
import { HelmetProvider } from 'react-helmet-async';
import { EventSEO } from './components/EventSEO';

// Code-split route & workflow chunks
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const DiscoveryWorkflow = lazy(() => import('./components/DiscoveryWorkflow').then(m => ({ default: m.DiscoveryWorkflow })));
const BudgetWorkflow = lazy(() => import('./components/BudgetWorkflow').then(m => ({ default: m.BudgetWorkflow })));
const TimelineWorkflow = lazy(() => import('./components/TimelineWorkflow').then(m => ({ default: m.TimelineWorkflow })));
const ScenarioWorkflow = lazy(() => import('./components/ScenarioWorkflow').then(m => ({ default: m.ScenarioWorkflow })));
const VendorWorkflow = lazy(() => import('./components/VendorWorkflow').then(m => ({ default: m.VendorWorkflow })));
const AICoordinatorDrawer = lazy(() => import('./components/AICoordinatorDrawer').then(m => ({ default: m.AICoordinatorDrawer })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));

const ComponentFallback = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center space-y-3 bg-white/70 rounded-3xl border border-stone-200/80 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-amber-600 animate-ping" />
    </div>
    <span className="text-xs font-semibold text-stone-500">Loading celebration workspace...</span>
  </div>
);

const STORAGE_KEY = 'eventos_ai_events_v3_assets';

export default function App() {
  const [eventsList, setEventsList] = useState<EventState[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('eventos_ai_events_v2_light');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize and repair any legacy /src/assets/images paths in cached storage
          return parsed.map((evt: EventState) => ({
            ...evt,
            vendors: evt.vendors?.map((v) => ({
              ...v,
              imageUrl: resolveVendorImage(v),
            })),
          }));
        }
      }
    } catch (e) {
      console.warn('Could not parse saved events, using defaults', e);
    }
    return [SAMPLE_WEDDING, SAMPLE_BIRTHDAY, SAMPLE_GALA];
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    return eventsList[0]?.id || SAMPLE_WEDDING.id;
  });

  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [activeSection, setActiveSection] = useState<string>('discovery');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Debounced sync to localStorage to eliminate CPU/storage thrash on rapid typing
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsList));
      } catch (e) {
        console.error('Failed to save events to local storage', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [eventsList]);

  // Scroll listener for active section indicator & scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      if (currentView === 'studio') {
        const sections = ['discovery', 'budget', 'timeline', 'scenarios', 'vendors'];
        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200 && rect.bottom >= 200) {
              setActiveSection(section);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const currentEvent = eventsList.find((e) => e.id === activeEventId) || eventsList[0] || SAMPLE_WEDDING;

  const handleUpdateCurrentEvent = (updated: EventState) => {
    setEventsList((prev) =>
      prev.map((evt) => (evt.id === updated.id ? updated : evt))
    );
  };

  const handleSaveNewEvent = (newEvent: EventState) => {
    setEventsList((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    setCurrentView('studio');
    handleNavigateSection('discovery');
  };

  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLaunchStudio = (targetSection?: string) => {
    setCurrentView('studio');
    if (targetSection) {
      setActiveSection(targetSection);
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRequestAiAssistance = (prompt: string) => {
    setIsAiDrawerOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <HelmetProvider>
      <EventSEO
        currentEvent={currentEvent}
        activeSection={activeSection}
        isLanding={currentView === 'landing'}
      />
      <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Top Reading Progress Bar (Framer Motion useScroll + useSpring) */}
        <ScrollProgressBar />

      <Suspense fallback={<ComponentFallback />}>
        {currentView === 'landing' ? (
          /* 1. The Interactive Landing Page */
          <LandingPage
            currentEvent={currentEvent}
            eventsList={eventsList}
            onSelectEvent={setActiveEventId}
            onLaunchStudio={handleLaunchStudio}
            onRequestAiAssistance={handleRequestAiAssistance}
          />
        ) : (
        /* 2. The Full Planning Studio Workspace */
        <>
          {/* Sticky Top Header Navigation */}
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

          {/* Studio Workspace Body with Human-UX Scroll Triggers */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-20">
            <h1 className="sr-only">Celebration Studio Planning Workspace — {currentEvent.name}</h1>
            {/* Don Norman Design Principles Conceptual Framework Guide */}
            <FadeInOnScroll direction="up" delay={0.02} distance={24} duration={0.6} scale={true} blur={false}>
              <NormanPrinciplesGuide 
                activeSection={activeSection} 
                onNavigateSection={handleNavigateSection} 
              />
            </FadeInOnScroll>

            {/* Section 1: Discovery & Core Constraint Intake */}
            <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale={true} blur={true}>
              <DiscoveryWorkflow
                currentEvent={currentEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onNavigateSection={handleNavigateSection}
                onRequestAiAssistance={handleRequestAiAssistance}
              />
            </FadeInOnScroll>

            {/* Section 2: Dynamic Budget Allocation & Priority Rebalancing */}
            <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale={true} blur={true}>
              <BudgetWorkflow
                currentEvent={currentEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onRequestAiAssistance={handleRequestAiAssistance}
              />
            </FadeInOnScroll>

            {/* Section 3: Sequential Timeline & Task Dependency Roadmap */}
            <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale={true} blur={true}>
              <TimelineWorkflow
                currentEvent={currentEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onRequestAiAssistance={handleRequestAiAssistance}
              />
            </FadeInOnScroll>

            {/* Section 4: Scenario Revision & Domino Trade-Off Engine */}
            <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale={true} blur={true}>
              <ScenarioWorkflow
                currentEvent={currentEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onRequestAiAssistance={handleRequestAiAssistance}
              />
            </FadeInOnScroll>

            {/* Section 5: Vendor Quotations & Hidden Fee Forensics */}
            <FadeInOnScroll direction="up" delay={0.04} distance={32} duration={0.75} scale={true} blur={true}>
              <VendorWorkflow
                currentEvent={currentEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onRequestAiAssistance={handleRequestAiAssistance}
              />
            </FadeInOnScroll>
          </main>
        </>
      )}
      </Suspense>

      {/* Floating Action Controls */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        {currentView === 'studio' && (
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-2xl shadow-md text-xs font-bold transition cursor-pointer hover:border-stone-300"
            title="Return to Landing Page"
          >
            <Home className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>
        )}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-11 h-11 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-2xl shadow-md flex items-center justify-center transition cursor-pointer"
            title="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl shadow-xl transition cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold">Ask Celebration Advisor</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-8 px-4 sm:px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">Celebration Studio</span>
            <span>—</span>
            <span>Your Personal Celebration Planner &amp; Budget Guardian</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-400 font-medium">
            <span>Genuine Joy Over Stress</span>
            <span>•</span>
            <span>Transparent, Honest Pricing</span>
            <span>•</span>
            <span>Total Peace of Mind</span>
          </div>
        </div>
      </footer>

      {/* Lazy-Loaded Modals & Drawers */}
      <Suspense fallback={null}>
        {/* Persistent AI Coordinator Drawer */}
        {isAiDrawerOpen && (
          <AICoordinatorDrawer
            isOpen={isAiDrawerOpen}
            onClose={() => setIsAiDrawerOpen(false)}
            currentEvent={currentEvent}
          />
        )}

        {/* Onboarding Wizard Modal */}
        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            onSaveNewEvent={handleSaveNewEvent}
          />
        )}

        {/* Dossier Export & Full Data Backup/Restore Modal */}
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
