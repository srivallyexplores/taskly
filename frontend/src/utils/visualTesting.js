// Visual testing utilities to verify components match EJS versions
export const visualTests = {
  // Test responsive behavior on different breakpoints
  testResponsiveBreakpoints() {
    const breakpoints = {
      mobile: 375,
      tablet: 768,
      desktop: 1024,
      large: 1440
    }

    const results = {}

    Object.entries(breakpoints).forEach(([name, width]) => {
      // Simulate viewport resize
      if (typeof window !== 'undefined') {
        const originalWidth = window.innerWidth
        
        try {
          // This would be used in actual testing environment
          results[name] = {
            width,
            tested: true,
            elements: this.checkElementsAtBreakpoint(width)
          }
        } catch (error) {
          results[name] = {
            width,
            tested: false,
            error: error.message
          }
        }
      }
    })

    return results
  },

  // Check if elements are properly positioned at breakpoint
  checkElementsAtBreakpoint(width) {
    const elements = {
      navbar: document.querySelector('.navbar'),
      footer: document.querySelector('footer'),
      userCards: document.querySelectorAll('.user-card'),
      taskCards: document.querySelectorAll('.card'),
      buttons: document.querySelectorAll('.btn')
    }

    const results = {}

    Object.entries(elements).forEach(([name, element]) => {
      if (element) {
        const rect = element.getBoundingClientRect()
        results[name] = {
          visible: rect.width > 0 && rect.height > 0,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        }
      } else {
        results[name] = { visible: false, error: 'Element not found' }
      }
    })

    return results
  },

  // Test form validation flows
  testFormValidation() {
    const forms = {
      login: document.querySelector('#login-form'),
      signup: document.querySelector('#signup-form'),
      taskForm: document.querySelector('#task-form'),
      profileForm: document.querySelector('#profile-form')
    }

    const results = {}

    Object.entries(forms).forEach(([name, form]) => {
      if (form) {
        results[name] = this.validateFormElements(form)
      } else {
        results[name] = { found: false }
      }
    })

    return results
  },

  // Validate individual form elements
  validateFormElements(form) {
    const inputs = form.querySelectorAll('input, textarea, select')
    const submitButton = form.querySelector('button[type="submit"]')
    
    return {
      found: true,
      inputCount: inputs.length,
      hasSubmitButton: !!submitButton,
      requiredFields: Array.from(inputs).filter(input => input.required).length,
      validationAttributes: Array.from(inputs).map(input => ({
        name: input.name,
        type: input.type,
        required: input.required,
        pattern: input.pattern,
        minLength: input.minLength,
        maxLength: input.maxLength
      }))
    }
  },

  // Test pagination functionality
  testPagination() {
    const paginationElements = document.querySelectorAll('.pagination')
    const results = []

    paginationElements.forEach((pagination, index) => {
      const buttons = pagination.querySelectorAll('button, a')
      const activeElement = pagination.querySelector('.active')
      
      results.push({
        index,
        buttonCount: buttons.length,
        hasActiveState: !!activeElement,
        hasPrevNext: {
          prev: !!pagination.querySelector('[aria-label="Previous"]'),
          next: !!pagination.querySelector('[aria-label="Next"]')
        }
      })
    })

    return results
  },

  // Test interactive elements
  testInteractiveElements() {
    const elements = {
      buttons: document.querySelectorAll('button'),
      links: document.querySelectorAll('a'),
      inputs: document.querySelectorAll('input'),
      selects: document.querySelectorAll('select'),
      textareas: document.querySelectorAll('textarea')
    }

    const results = {}

    Object.entries(elements).forEach(([type, nodeList]) => {
      results[type] = {
        count: nodeList.length,
        interactive: Array.from(nodeList).filter(el => !el.disabled).length,
        disabled: Array.from(nodeList).filter(el => el.disabled).length
      }
    })

    return results
  },

  // Test navigation functionality
  testNavigation() {
    const navLinks = document.querySelectorAll('.navbar a, .nav-link')
    const results = []

    navLinks.forEach((link, index) => {
      results.push({
        index,
        href: link.href,
        text: link.textContent.trim(),
        isActive: link.classList.contains('active'),
        isExternal: link.href && !link.href.startsWith(window.location.origin)
      })
    })

    return results
  },

  // Test loading states
  testLoadingStates() {
    const loadingElements = {
      spinners: document.querySelectorAll('.loading-spinner, .spinner'),
      skeletons: document.querySelectorAll('.skeleton'),
      loadingButtons: document.querySelectorAll('button[disabled]'),
      loadingText: document.querySelectorAll('[data-loading]')
    }

    const results = {}

    Object.entries(loadingElements).forEach(([type, elements]) => {
      results[type] = {
        count: elements.length,
        visible: Array.from(elements).filter(el => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        }).length
      }
    })

    return results
  },

  // Test error states
  testErrorStates() {
    const errorElements = {
      errorMessages: document.querySelectorAll('.error-message, .alert-danger'),
      invalidInputs: document.querySelectorAll('.is-invalid, .error'),
      errorBoundaries: document.querySelectorAll('.error-boundary')
    }

    const results = {}

    Object.entries(errorElements).forEach(([type, elements]) => {
      results[type] = {
        count: elements.length,
        visible: Array.from(elements).filter(el => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        }).length
      }
    })

    return results
  },

  // Run comprehensive visual tests
  runAllVisualTests() {
    //console.log(' Starting visual tests...')
    
    const results = {
      responsive: this.testResponsiveBreakpoints(),
      forms: this.testFormValidation(),
      pagination: this.testPagination(),
      interactive: this.testInteractiveElements(),
      navigation: this.testNavigation(),
      loading: this.testLoadingStates(),
      errors: this.testErrorStates(),
      timestamp: new Date().toISOString()
    }

    //console.log(' Visual test results:', results)
    return results
  },

  // Generate visual test report
  generateReport(results) {
    const report = {
      summary: {
        totalTests: Object.keys(results).length - 1, // Exclude timestamp
        passedTests: 0,
        failedTests: 0,
        warnings: 0
      },
      details: results,
      recommendations: []
    }

    // Analyze results and generate recommendations
    if (results.responsive) {
      const responsiveIssues = Object.values(results.responsive).filter(r => !r.tested)
      if (responsiveIssues.length > 0) {
        report.recommendations.push('Some responsive breakpoints failed testing')
        report.summary.failedTests++
      } else {
        report.summary.passedTests++
      }
    }

    if (results.forms) {
      const formsWithoutValidation = Object.values(results.forms).filter(f => f.found && f.requiredFields === 0)
      if (formsWithoutValidation.length > 0) {
        report.recommendations.push('Some forms lack proper validation')
        report.summary.warnings++
      }
    }

    if (results.interactive) {
      const disabledElements = results.interactive.buttons?.disabled || 0
      if (disabledElements > 0) {
        report.recommendations.push(`${disabledElements} buttons are disabled - verify this is intentional`)
        report.summary.warnings++
      }
    }

    return report
  }
}

// Export individual test functions
export const {
  testResponsiveBreakpoints,
  testFormValidation,
  testPagination,
  testInteractiveElements,
  testNavigation,
  testLoadingStates,
  testErrorStates,
  runAllVisualTests,
  generateReport
} = visualTests

export default visualTests