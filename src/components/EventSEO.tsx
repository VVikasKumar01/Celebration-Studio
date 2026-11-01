import React from 'react';
import { Helmet } from 'react-helmet-async';
import { EventState } from '../types/event';
import { IMAGES } from '../assets/images';

interface EventSEOProps {
  currentEvent?: EventState;
  activeSection?: string;
  isLanding?: boolean;
}

export const EventSEO: React.FC<EventSEOProps> = ({
  currentEvent,
  activeSection = 'discovery',
  isLanding = false,
}) => {
  let pageTitle = 'Celebration Studio — Personal Celebration Planner & Budget Guardian';
  let metaDescription = 'Plan weddings, milestone birthdays, and unforgettable gatherings with effortless grace, transparent budgets, calm timelines, and verified dream vendors.';
  let pageType = 'website';
  let shareImage = IMAGES.hero;

  const sectionLabels: Record<string, string> = {
    discovery: 'Vision & Atmosphere',
    budget: 'Smart Budget & Financial Balance',
    timeline: 'Calm Flow & Timeline Dependencies',
    scenarios: 'Peace-of-Mind Backups & Contingencies',
    vendors: 'Verified Vendor Quotes & Audits',
  };

  if (!isLanding && currentEvent) {
    const sectionName = sectionLabels[activeSection] || 'Celebration Plan';
    pageTitle = `${sectionName} · ${currentEvent.name} — Celebration Studio`;
    metaDescription = `Plan ${currentEvent.name} (${currentEvent.type}) with a $${currentEvent.budgetCeiling.toLocaleString()} budget and ${currentEvent.guestCount} guests. ${currentEvent.vibe}`;
    pageType = 'article';

    if (activeSection === 'vendors') {
      shareImage = IMAGES.venue;
    } else if (activeSection === 'budget') {
      shareImage = IMAGES.catering;
    } else {
      shareImage = IMAGES.hero;
    }
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://celebration-studio-nine.vercel.app';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://celebration-studio-nine.vercel.app';
  const fullImageUrl = shareImage.startsWith('http') ? shareImage : `${origin}${shareImage.startsWith('/') ? '' : '/'}${shareImage}`;

  // Structured data JSON-LD for rich snippets
  const eventStructuredData = (!isLanding && currentEvent) ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': currentEvent.name,
    'description': currentEvent.vibe,
    'startDate': currentEvent.targetDate,
    'eventStatus': 'https://schema.org/EventScheduled',
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'maximumAttendeeCapacity': currentEvent.guestCount,
    'organizer': {
      '@type': 'Organization',
      'name': 'Celebration Studio',
      'url': origin,
    },
    'image': [fullImageUrl],
  } : null;

  return (
    <Helmet>
      {/* Dynamic Title */}
      <title>{pageTitle}</title>

      {/* Meta Descriptions */}
      <meta name="description" content={metaDescription} />

      {/* OpenGraph / Facebook / LinkedIn / Discord Social Cards */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={pageType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:site_name" content="Celebration Studio" />

      {/* Twitter / X Social Share Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Canonical Link */}
      <link rel="canonical" href={currentUrl} />

      {/* Dynamic JSON-LD Structured Data */}
      {eventStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(eventStructuredData)}
        </script>
      )}
    </Helmet>
  );
};
