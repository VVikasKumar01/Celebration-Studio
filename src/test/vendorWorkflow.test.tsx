import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorWorkflow } from '../components/VendorWorkflow';
import { SAMPLE_WEDDING } from '../data/sampleEvents';

describe('VendorWorkflow Component', () => {
  it('renders vendor comparison table and stats', () => {
    const handleUpdate = vi.fn();
    const handleAi = vi.fn();

    render(
      <VendorWorkflow
        currentEvent={SAMPLE_WEDDING}
        onUpdateEvent={handleUpdate}
        onRequestAiAssistance={handleAi}
      />
    );

    expect(screen.getByText('Your Dream Creative Team & Quotes')).toBeInTheDocument();
    expect(screen.getByText('Vendor Quotes & Transparent Comparison')).toBeInTheDocument();
    expect(screen.getAllByText('The Glasshouse Conservatory').length).toBeGreaterThan(0);
  });

  it('opens accessible confirmation alertdialog on delete and cancels gracefully', () => {
    const handleUpdate = vi.fn();
    const handleAi = vi.fn();

    render(
      <VendorWorkflow
        currentEvent={SAMPLE_WEDDING}
        onUpdateEvent={handleUpdate}
        onRequestAiAssistance={handleAi}
      />
    );

    // Click remove quote on first vendor
    const deleteButtons = screen.getAllByTitle(/Remove quote for/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    // Accessible modal should appear
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Remove Vendor Quote?')).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    // Modal closes without calling onUpdateEvent
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('deletes vendor and invokes onUpdateEvent when confirmed in modal', () => {
    const handleUpdate = vi.fn();
    const handleAi = vi.fn();

    render(
      <VendorWorkflow
        currentEvent={SAMPLE_WEDDING}
        onUpdateEvent={handleUpdate}
        onRequestAiAssistance={handleAi}
      />
    );

    const deleteButtons = screen.getAllByTitle(/Remove quote for/i);
    fireEvent.click(deleteButtons[0]);

    const confirmBtn = screen.getByText('Yes, Remove Quote');
    fireEvent.click(confirmBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated.vendors.length).toBe(SAMPLE_WEDDING.vendors.length - 1);
  });
});
