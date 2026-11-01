import { describe, it, expect } from 'vitest';
import { SAMPLE_WEDDING } from '../data/sampleEvents';
import { CategoryKey, VendorQuote } from '../types/event';

describe('Budget & Financial Calculation Engine', () => {
  it('correctly calculates total allocated funds and validates against budget ceiling', () => {
    const totalAllocated = Object.values(SAMPLE_WEDDING.categories).reduce(
      (sum, cat) => sum + cat.allocated,
      0
    );
    expect(totalAllocated).toBe(SAMPLE_WEDDING.budgetCeiling);
  });

  it('calculates correct per-guest investment ratios', () => {
    const perGuestCost = Math.round(
      SAMPLE_WEDDING.budgetCeiling / (SAMPLE_WEDDING.guestCount || 1)
    );
    expect(perGuestCost).toBe(300); // $36,000 / 120 guests = $300/guest
  });

  it('accurately tallies verified quotes vs estimated assumptions', () => {
    const verifiedTotal = SAMPLE_WEDDING.budgetItems
      .filter((i) => i.type === 'verified_quote')
      .reduce((acc, i) => acc + i.amount, 0);

    const estimatedTotal = SAMPLE_WEDDING.budgetItems
      .filter((i) => i.type === 'estimated_assumption')
      .reduce((acc, i) => acc + i.amount, 0);

    expect(verifiedTotal + estimatedTotal).toBeGreaterThan(0);
    expect(verifiedTotal).toBe(25140); // Total contracted items
    expect(estimatedTotal).toBe(9440); // Total estimated assumptions
  });

  it('accurately computes true vendor total including hidden auxiliary fees', () => {
    const mockVendor: VendorQuote = {
      id: 'test-v1',
      vendorName: 'Artisan Culinary Co.',
      category: 'Catering',
      baseQuote: 7800,
      hiddenFees: [
        { name: 'Admin Fee', amountOrRate: '24%', estimatedCost: 1872 },
        { name: 'Sales Tax', amountOrRate: '8.25%', estimatedCost: 643 },
        { name: 'Cake Cutting', amountOrRate: '$3/head', estimatedCost: 360 },
      ],
      trueTotalCost: 10675,
      scopeIncluded: ['Dinner', 'Staff'],
      scopeExcludedOrExtra: ['Barware'],
      redFlags: [],
      missingDetails: [],
      status: 'pending',
    };

    const calculatedHiddenFeesTotal = mockVendor.hiddenFees.reduce(
      (sum, f) => sum + f.estimatedCost,
      0
    );
    const calculatedTrueTotal = mockVendor.baseQuote + calculatedHiddenFeesTotal;

    expect(calculatedHiddenFeesTotal).toBe(2875);
    expect(calculatedTrueTotal).toBe(10675);
    expect(mockVendor.trueTotalCost).toBe(calculatedTrueTotal);
  });

  it('enforces that emergency contingency buffer is preserved', () => {
    const contingency = SAMPLE_WEDDING.categories.contingency;
    expect(contingency).toBeDefined();
    expect(contingency.percentage).toBeGreaterThanOrEqual(5);
    expect(contingency.allocated).toBeGreaterThan(0);
  });

  describe('Budget Edge Cases & Boundary Conditions', () => {
    it('safely calculates per-guest cost with 1 guest (single celebration)', () => {
      const budget = 5000;
      const guests = 1;
      const perGuest = Math.round(budget / Math.max(1, guests));
      expect(perGuest).toBe(5000);
      expect(Number.isFinite(perGuest)).toBe(true);
    });

    it('guards against division by zero when guest count is 0 or negative', () => {
      const budget = 25000;
      const zeroGuests = 0;
      const perGuestZero = Math.round(budget / Math.max(1, zeroGuests));
      expect(perGuestZero).toBe(25000);
      expect(Number.isNaN(perGuestZero)).toBe(false);

      const negativeGuests = -5;
      const perGuestNegative = Math.round(budget / Math.max(1, negativeGuests));
      expect(perGuestNegative).toBe(25000);
      expect(Number.isNaN(perGuestNegative)).toBe(false);
    });

    it('handles transparent vendors with zero hidden fees accurately', () => {
      const transparentVendor: VendorQuote = {
        id: 'transparent-v1',
        vendorName: 'Clear Price Audio',
        category: 'Music & DJ',
        baseQuote: 1500,
        hiddenFees: [],
        trueTotalCost: 1500,
        scopeIncluded: ['Sound rig', 'Wireless mic'],
        scopeExcludedOrExtra: [],
        redFlags: [],
        missingDetails: [],
        status: 'approved',
      };

      const feesTotal = transparentVendor.hiddenFees.reduce((sum, f) => sum + f.estimatedCost, 0);
      expect(feesTotal).toBe(0);
      expect(transparentVendor.baseQuote + feesTotal).toBe(1500);
      expect(transparentVendor.trueTotalCost).toBe(1500);
    });
  });
});
