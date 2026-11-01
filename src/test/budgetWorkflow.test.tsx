import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetWorkflow } from '../components/BudgetWorkflow';
import { SAMPLE_WEDDING } from '../data/sampleEvents';

describe('BudgetWorkflow Component', () => {
  it('renders budget ceiling, confirmed bookings, and progress bars', () => {
    const handleUpdate = vi.fn();
    const handleAi = vi.fn();

    render(
      <BudgetWorkflow
        currentEvent={SAMPLE_WEDDING}
        onUpdateEvent={handleUpdate}
        onRequestAiAssistance={handleAi}
      />
    );

    // Verifies budget numbers are rendered
    expect(screen.getByText(`$${SAMPLE_WEDDING.budgetCeiling.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText('Confirmed & Booked')).toBeInTheDocument();
    expect(screen.getByText('Estimates & Ideas')).toBeInTheDocument();

    // Verifies accessibility progress bars are present
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(3);
  });

  it('allows executing a quick balance adjustment and invokes onUpdateEvent', () => {
    const handleUpdate = vi.fn();
    const handleAi = vi.fn();

    render(
      <BudgetWorkflow
        currentEvent={SAMPLE_WEDDING}
        onUpdateEvent={handleUpdate}
        onRequestAiAssistance={handleAi}
      />
    );

    const plusThousandBtn = screen.getByText('+$1,000');
    expect(plusThousandBtn).toBeInTheDocument();
    fireEvent.click(plusThousandBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updatedEvent = handleUpdate.mock.calls[0][0];
    expect(updatedEvent).toBeDefined();
    expect(updatedEvent.categories).toBeDefined();
  });
});
