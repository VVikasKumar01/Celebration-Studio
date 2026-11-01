import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../components/OnboardingModal';
import { ExportModal } from '../components/ExportModal';
import { SAMPLE_WEDDING } from '../data/sampleEvents';

describe('Modal Accessibility & Keyboard Interaction', () => {
  it('renders OnboardingModal with dialog role and closes when Escape key is pressed', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={handleClose}
        onSaveNewEvent={handleSave}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-modal-title');

    // Simulate pressing Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders ExportModal with accessible attributes and closes via Escape key', () => {
    const handleClose = vi.fn();

    render(
      <ExportModal
        isOpen={true}
        onClose={handleClose}
        currentEvent={SAMPLE_WEDDING}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'export-modal-title');

    // Test close button accessible label
    const closeBtn = screen.getByLabelText('Close dialog');
    expect(closeBtn).toBeInTheDocument();

    // Simulate pressing Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
