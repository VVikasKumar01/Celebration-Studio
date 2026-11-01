import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY } from '../data/sampleEvents';

describe('Header & Navigation Component', () => {
  it('renders brand identity and celebration switcher', () => {
    const handleSelectEvent = vi.fn();
    const handleNewEvent = vi.fn();
    const handleNavigate = vi.fn();
    const handleSetAiDrawer = vi.fn();
    const handleExport = vi.fn();

    render(
      <Header
        currentEvent={SAMPLE_WEDDING}
        eventsList={[SAMPLE_WEDDING, SAMPLE_BIRTHDAY]}
        onSelectEvent={handleSelectEvent}
        onNewEvent={handleNewEvent}
        activeSection="discovery"
        onNavigateSection={handleNavigate}
        isAiDrawerOpen={false}
        setIsAiDrawerOpen={handleSetAiDrawer}
        onExportDossier={handleExport}
      />
    );

    // Verify brand text exists
    expect(screen.getByText('Celebration')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();

    // Verify event switcher select
    const select = screen.getByLabelText('Active Celebration');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue(SAMPLE_WEDDING.id);

    // Change event selection
    fireEvent.change(select, { target: { value: SAMPLE_BIRTHDAY.id } });
    expect(handleSelectEvent).toHaveBeenCalledWith(SAMPLE_BIRTHDAY.id);
  });

  it('triggers section navigation callbacks when workflow tabs are clicked', () => {
    const handleNavigate = vi.fn();

    render(
      <Header
        currentEvent={SAMPLE_WEDDING}
        eventsList={[SAMPLE_WEDDING]}
        onSelectEvent={vi.fn()}
        onNewEvent={vi.fn()}
        activeSection="discovery"
        onNavigateSection={handleNavigate}
        isAiDrawerOpen={false}
        setIsAiDrawerOpen={vi.fn()}
        onExportDossier={vi.fn()}
      />
    );

    // Click on Smart Budget tab
    const budgetTab = screen.getByText('Smart Budget');
    fireEvent.click(budgetTab);
    expect(handleNavigate).toHaveBeenCalledWith('budget');

    // Click on Flow & Timeline tab
    const timelineTab = screen.getByText('Flow & Timeline');
    fireEvent.click(timelineTab);
    expect(handleNavigate).toHaveBeenCalledWith('timeline');
  });

  it('triggers action buttons (Export and New Plan)', () => {
    const handleNewEvent = vi.fn();
    const handleExport = vi.fn();

    render(
      <Header
        currentEvent={SAMPLE_WEDDING}
        eventsList={[SAMPLE_WEDDING]}
        onSelectEvent={vi.fn()}
        onNewEvent={handleNewEvent}
        activeSection="discovery"
        onNavigateSection={vi.fn()}
        isAiDrawerOpen={false}
        setIsAiDrawerOpen={vi.fn()}
        onExportDossier={handleExport}
      />
    );

    const exportBtn = screen.getByTitle('Download full celebration plan');
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);

    const newPlanBtn = screen.getByTitle('Create a new celebration plan');
    fireEvent.click(newPlanBtn);
    expect(handleNewEvent).toHaveBeenCalledTimes(1);
  });
});
