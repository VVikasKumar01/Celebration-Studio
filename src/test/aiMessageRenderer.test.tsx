import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIMessageRenderer } from '../components/AIMessageRenderer';

describe('AIMessageRenderer Component (Human Text, Tables & Cards)', () => {
  it('parses and renders markdown tables into structured HTML tables', () => {
    const tableMarkdown = `Here is your budget allocation breakdown:

| Category | Planned Allocation | Share | Benchmark Guidance |
| :--- | :--- | :--- | :--- |
| **Catering** | $12,500 | 35% | Covers 3-course dinner + bar |
| **Venue** | $8,500 | 24% | Grounds access & suites |
`;

    render(<AIMessageRenderer content={tableMarkdown} />);

    // Table headers should exist
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Planned Allocation')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();

    // Rows and cells should exist
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('$12,500')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
  });

  it('transforms callout quotes into styled Concierge Tip and Warning cards', () => {
    const calloutMarkdown = `
> 💡 **Concierge Tip:** Book your photographer at least 8 months in advance.
> ⚠️ **Watch Out For:** Catering service charge is not gratuity for the waitstaff.
`;

    render(<AIMessageRenderer content={calloutMarkdown} />);

    expect(screen.getByText('Concierge Tip')).toBeInTheDocument();
    expect(screen.getByText(/Book your photographer at least 8 months in advance/)).toBeInTheDocument();

    expect(screen.getByText('Watch Out For')).toBeInTheDocument();
    expect(screen.getByText(/Catering service charge is not gratuity/)).toBeInTheDocument();
  });

  it('renders numbered next-step cards with interactive Explore buttons', () => {
    const onActionClick = vi.fn();
    const stepsMarkdown = `
### Next Steps for You
1. Confirm final guest headcount with caterer.
2. Sign venue deposit agreement.
`;

    render(<AIMessageRenderer content={stepsMarkdown} onActionClick={onActionClick} />);

    expect(screen.getByText('Next Steps for You')).toBeInTheDocument();
    expect(screen.getByText('Confirm final guest headcount with caterer.')).toBeInTheDocument();
    expect(screen.getByText('Sign venue deposit agreement.')).toBeInTheDocument();

    // Verify click triggers callback
    const exploreButtons = screen.getAllByTitle('Ask Sarah about this step');
    expect(exploreButtons.length).toBe(2);
    fireEvent.click(exploreButtons[0]);
    expect(onActionClick).toHaveBeenCalledWith('Confirm final guest headcount with caterer.');
  });

  it('renders status badges with appropriate visual styling', () => {
    const statusMarkdown = `Catering contract is [Contracted] and floral deposit is [Pending].`;

    render(<AIMessageRenderer content={statusMarkdown} />);

    const contractedBadge = screen.getByText('[Contracted]');
    expect(contractedBadge).toBeInTheDocument();
    expect(contractedBadge).toHaveClass('bg-emerald-50');

    const pendingBadge = screen.getByText('[Pending]');
    expect(pendingBadge).toBeInTheDocument();
    expect(pendingBadge).toHaveClass('bg-indigo-50');
  });
});
