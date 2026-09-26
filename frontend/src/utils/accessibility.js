// Accessibility utilities and helpers

// Focus management utilities
export const focusManagement = {
  // Trap focus within an element
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restore focus to previously focused element
  restoreFocus: (() => {
    let previouslyFocused = null;

    return {
      save: () => {
        previouslyFocused = document.activeElement;
      },
      restore: () => {
        if (previouslyFocused && previouslyFocused.focus) {
          previouslyFocused.focus();
          previouslyFocused = null;
        }
      }
    };
  })(),

  // Move focus to element with announcement
  moveFocusTo: (element, announcement) => {
    if (element && element.focus) {
      element.focus();
      
      if (announcement) {
        announceToScreenReader(announcement);
      }
    }
  },

  // Get next/previous focusable element
  getNextFocusable: (currentElement, direction = 'next') => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));

    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (direction === 'next') {
      return focusableElements[currentIndex + 1] || focusableElements[0];
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }
  }
};

// Screen reader announcements
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'aria') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set up ARIA relationships
  setupAriaRelationship: (trigger, target, relationship = 'describedby') => {
    const id = target.id || ariaUtils.generateId();
    target.id = id;
    trigger.setAttribute(`aria-${relationship}`, id);
    return id;
  },

  // Update ARIA live region
  updateLiveRegion: (element, message, priority = 'polite') => {
    element.setAttribute('aria-live', priority);
    element.textContent = message;
  },

  // Toggle ARIA expanded state
  toggleExpanded: (element, expanded) => {
    element.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  },

  // Set ARIA pressed state
  setPressed: (element, pressed) => {
    element.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  },

  // Set ARIA selected state
  setSelected: (element, selected) => {
    element.setAttribute('aria-selected', selected ? 'true' : 'false');
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowNavigation: (event, items, currentIndex, options = {}) => {
    const { 
      orientation = 'vertical',
      loop = true,
      onSelect,
      onNavigate
    } = options;

    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    let newIndex = currentIndex;

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        newIndex = currentIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
        break;

      case prevKey:
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex, items[currentIndex]);
        }
        return currentIndex;

      default:
        return currentIndex;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
      
      if (onNavigate) {
        onNavigate(newIndex, items[newIndex]);
      }
    }

    return newIndex;
  },

  // Handle typeahead navigation
  handleTypeahead: (event, items, options = {}) => {
    const { 
      getItemText = (item) => item.textContent,
      onMatch
    } = options;

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey) {
      return -1;
    }

    const searchChar = event.key.toLowerCase();
    const currentTime = Date.now();
    
    // Clear search if too much time has passed
    if (!keyboardNavigation._typeaheadTimeout || currentTime - keyboardNavigation._lastTypeahead > 500) {
      keyboardNavigation._typeaheadString = '';
    }
    
    keyboardNavigation._typeaheadString += searchChar;
    keyboardNavigation._lastTypeahead = currentTime;

    // Find matching item
    const matchIndex = items.findIndex(item => {
      const itemText = getItemText(item).toLowerCase();
      return itemText.startsWith(keyboardNavigation._typeaheadString);
    });

    if (matchIndex !== -1) {
      items[matchIndex].focus();
      
      if (onMatch) {
        onMatch(matchIndex, items[matchIndex]);
      }
    }

    // Clear typeahead after delay
    clearTimeout(keyboardNavigation._typeaheadTimeout);
    keyboardNavigation._typeaheadTimeout = setTimeout(() => {
      keyboardNavigation._typeaheadString = '';
    }, 500);

    return matchIndex;
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1, color2) => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = 'AA', size = 'normal') => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    return ratio >= requirements[level][size];
  },

  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
};

// Reduced motion utilities
export const reducedMotion = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get appropriate animation duration
  getAnimationDuration: (defaultDuration) => {
    return reducedMotion.prefersReducedMotion() ? 0 : defaultDuration;
  },

  // Apply reduced motion styles
  applyReducedMotion: (element) => {
    if (reducedMotion.prefersReducedMotion()) {
      element.style.animation = 'none';
      element.style.transition = 'none';
    }
  }
};

// High contrast utilities
export const highContrast = {
  // Check if high contrast mode is enabled
  isHighContrastMode: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Apply high contrast styles
  applyHighContrastStyles: (element) => {
    if (highContrast.isHighContrastMode()) {
      element.classList.add('high-contrast');
    }
  }
};

// Text utilities for accessibility
export const textUtils = {
  // Truncate text with proper ellipsis
  truncateText: (text, maxLength, suffix = '...') => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  // Generate accessible label from text
  generateAccessibleLabel: (text, context) => {
    const cleanText = text.replace(/[^\w\s]/gi, '').trim();
    return context ? `${cleanText} ${context}` : cleanText;
  },

  // Check if text is readable
  isReadableText: (text) => {
    const readabilityScore = textUtils.calculateReadabilityScore(text);
    return readabilityScore >= 60; // Flesch Reading Ease score
  },

  // Simple readability score calculation
  calculateReadabilityScore: (text) => {
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = text.split(/\s+/).length;
    const syllables = textUtils.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  },

  // Count syllables in text
  countSyllables: (text) => {
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((total, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return total + Math.max(1, syllableCount);
    }, 0);
  }
};

// Accessibility testing utilities
export const a11yTesting = {
  // Check for missing alt text
  checkMissingAltText: () => {
    const images = document.querySelectorAll('img:not([alt])');
    return Array.from(images).map(img => ({
      element: img,
      issue: 'Missing alt attribute',
      severity: 'error'
    }));
  },

  // Check for missing form labels
  checkMissingFormLabels: () => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const issues = [];

    inputs.forEach(input => {
      const hasLabel = input.labels?.length > 0 || 
                     input.getAttribute('aria-label') || 
                     input.getAttribute('aria-labelledby');
      
      if (!hasLabel) {
        issues.push({
          element: input,
          issue: 'Missing form label',
          severity: 'error'
        });
      }
    });

    return issues;
  },

  // Check for insufficient color contrast
  checkColorContrast: () => {
    const elements = document.querySelectorAll('*');
    const issues = [];

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Skip if no text content
      if (!element.textContent?.trim()) return;

      // Convert colors and check contrast
      // This is a simplified version - in practice, you'd need a more robust color parser
      const textColor = colorContrast.hexToRgb(color);
      const bgColor = colorContrast.hexToRgb(backgroundColor);

      if (textColor && bgColor) {
        const ratio = colorContrast.getContrastRatio(textColor, bgColor);
        if (ratio < 4.5) {
          issues.push({
            element,
            issue: `Insufficient color contrast (${ratio.toFixed(2)}:1)`,
            severity: 'warning'
          });
        }
      }
    });

    return issues;
  },

  // Run all accessibility checks
  runAllChecks: () => {
    return [
      ...a11yTesting.checkMissingAltText(),
      ...a11yTesting.checkMissingFormLabels(),
      ...a11yTesting.checkColorContrast()
    ];
  }
};

// Export all utilities
export default {
  focusManagement,
  announceToScreenReader,
  ariaUtils,
  keyboardNavigation,
  colorContrast,
  reducedMotion,
  highContrast,
  textUtils,
  a11yTesting
};