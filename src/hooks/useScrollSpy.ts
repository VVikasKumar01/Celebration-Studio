/**
 * @file src/hooks/useScrollSpy.ts
 * @description Lightweight scroll-spy hook that tracks which section is
 * currently in the viewport and whether the page has scrolled past a given
 * threshold (used to show the "scroll to top" FAB).
 */

import { useState, useEffect } from 'react';
import {
  SCROLL_TOP_THRESHOLD_PX,
  SCROLL_SPY_OFFSET_PX,
  type StudioSection,
  STUDIO_SECTIONS,
} from '../constants';

/** Return value of `useScrollSpy`. */
export interface ScrollSpyResult {
  /** The ID of the studio section currently in the viewport. */
  activeSection: StudioSection;
  /** Setter — allows programmatic override (e.g. on nav click). */
  setActiveSection: React.Dispatch<React.SetStateAction<StudioSection>>;
  /** `true` once the user has scrolled past `SCROLL_TOP_THRESHOLD_PX`. */
  showScrollTop: boolean;
}

/**
 * Observes window scroll events and derives the currently visible studio
 * section and whether the "scroll-to-top" button should be visible.
 *
 * @param isStudioView - When `false` (landing page), the section scan is
 *                       skipped to avoid unnecessary DOM queries.
 * @returns `{ activeSection, setActiveSection, showScrollTop }`
 *
 * @example
 * const { activeSection, setActiveSection, showScrollTop } = useScrollSpy(
 *   currentView === 'studio',
 * );
 */
export function useScrollSpy(isStudioView: boolean): ScrollSpyResult {
  const [activeSection, setActiveSection] = useState<StudioSection>('discovery');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > SCROLL_TOP_THRESHOLD_PX);

      if (!isStudioView) return;

      for (const section of STUDIO_SECTIONS) {
        const el = document.getElementById(section);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= SCROLL_SPY_OFFSET_PX && rect.bottom >= SCROLL_SPY_OFFSET_PX) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isStudioView]);

  return { activeSection, setActiveSection, showScrollTop };
}
