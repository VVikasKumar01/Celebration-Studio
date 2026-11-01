import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';

// Polyfill window.matchMedia for jsdom if needed
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return false; },
    };
  };

  // Polyfill scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = function() {};
  window.scrollTo = function() {};
}
