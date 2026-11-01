import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { EventSEO } from '../components/EventSEO';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY } from '../data/sampleEvents';

describe('EventSEO Component (Dynamic Head & Social Metadata)', () => {
  it('renders landing page SEO title and meta tags', async () => {
    const helmetContext = {};

    render(
      <HelmetProvider context={helmetContext}>
        <EventSEO isLanding={true} />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe(
        'Celebration Studio — Personal Celebration Planner & Budget Guardian'
      );
    });

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toContain('Plan weddings, milestone birthdays');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe(
      'Celebration Studio — Personal Celebration Planner & Budget Guardian'
    );
  });

  it('dynamically updates title and description for specific celebration and section', async () => {
    const helmetContext = {};

    render(
      <HelmetProvider context={helmetContext}>
        <EventSEO
          currentEvent={SAMPLE_WEDDING}
          activeSection="budget"
          isLanding={false}
        />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toContain('Smart Budget & Financial Balance');
      expect(document.title).toContain('Golden Botanical Garden Wedding');
    });

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toContain('36,000');
    expect(metaDescription?.getAttribute('content')).toContain('120 guests');

    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('article');

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
  });

  it('updates title when switching celebration to birthday event', async () => {
    const helmetContext = {};

    render(
      <HelmetProvider context={helmetContext}>
        <EventSEO
          currentEvent={SAMPLE_BIRTHDAY}
          activeSection="vendors"
          isLanding={false}
        />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toContain('Verified Vendor Quotes & Audits');
      expect(document.title).toContain('Neon Skyline 30th Birthday Celebration');
    });

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toContain('9,500');
    expect(metaDescription?.getAttribute('content')).toContain('50 guests');
  });
});
