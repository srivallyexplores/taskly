// Form validation testing utilities
export const formValidationTests = {
  // Test login form validation
  testLoginForm() {
    const tests = {
      emailValidation: false,
      passwordValidation: false,
      submitButtonState: false,
      errorDisplay: false
    }

    try {
      // Test email validation
      const emailInput = document.querySelector('input[name="email"]')
      if (emailInput) {
        // Test invalid email
        emailInput.value = 'invalid-email'
        emailInput.dispatchEvent(new Event('blur'))
        
        // Check if validation error appears
        const emailError = document.querySelector('.invalid-feedback') || 
                          document.querySelector('.error-text')
        tests.emailValidation = !!emailError
      }

      // Test password validation
      const passwordInput = document.querySelector('input[name="password"]')
      if (passwordInput) {
        // Test empty password
        passwordInput.value = ''
        passwordInput.dispatchEvent(new Event('blur'))
        
        // Check if validation error appears
        const passwordError = document.querySelector('.invalid-feedback') || 
                             document.querySelector('.error-text')
        tests.passwordValidation = !!passwordError
      }

      // Test submit button state
      const submitButton = document.querySelector('button[type="submit"]')
      if (submitButton) {
        tests.submitButtonState = !submitButton.disabled
      }

      //console.log('✅ Login form validation tests completed')
    } catch (error) {
      //console.error('❌ Login form validation tests failed:', error.message)
    }

    return tests
  },

  // Test signup form validation
  testSignupForm() {
    const tests = {
      fullnameValidation: false,
      usernameValidation: false,
      emailValidation: false,
      passwordValidation: false,
      confirmPasswordValidation: false,
      submitButtonState: false
    }

    try {
      // Test fullname validation
      const fullnameInput = document.querySelector('input[name="fullname"]')
      if (fullnameInput) {
        fullnameInput.value = 'a' // Too short
        fullnameInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.fullnameValidation = !!error
      }

      // Test username validation
      const usernameInput = document.querySelector('input[name="username"]')
      if (usernameInput) {
        usernameInput.value = 'ab' // Too short
        usernameInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.usernameValidation = !!error
      }

      // Test email validation
      const emailInput = document.querySelector('input[name="email"]')
      if (emailInput) {
        emailInput.value = 'invalid-email'
        emailInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.emailValidation = !!error
      }

      // Test password validation
      const passwordInput = document.querySelector('input[name="password"]')
      if (passwordInput) {
        passwordInput.value = '123' // Too short
        passwordInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.passwordValidation = !!error
      }

      // Test confirm password validation
      const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
      if (confirmPasswordInput && passwordInput) {
        passwordInput.value = 'password123'
        confirmPasswordInput.value = 'different'
        confirmPasswordInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.confirmPasswordValidation = !!error
      }

      //console.log('✅ Signup form validation tests completed')
    } catch (error) {
      //console.error('❌ Signup form validation tests failed:', error.message)
    }

    return tests
  },

  // Test task form validation
  testTaskForm() {
    const tests = {
      titleValidation: false,
      dueDateValidation: false,
      priorityValidation: false,
      tagFunctionality: false,
      quickDateButtons: false
    }

    try {
      // Test title validation
      const titleInput = document.querySelector('input[name="title"]')
      if (titleInput) {
        titleInput.value = ''
        titleInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.titleValidation = !!error
      }

      // Test due date validation
      const dueDateInput = document.querySelector('input[name="due"]')
      if (dueDateInput) {
        // Test past date
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        dueDateInput.value = yesterday.toISOString().split('T')[0]
        dueDateInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.dueDateValidation = !!error
      }

      // Test priority validation
      const priorityInputs = document.querySelectorAll('input[name="priority"]')
      if (priorityInputs.length > 0) {
        // Ensure no priority is selected
        priorityInputs.forEach(input => input.checked = false)
        
        // Try to submit form
        const form = document.querySelector('form')
        if (form) {
          form.dispatchEvent(new Event('submit'))
          
          const error = document.querySelector('.invalid-feedback')
          tests.priorityValidation = !!error
        }
      }

      // Test tag functionality
      const tagInput = document.querySelector('#tag-input')
      if (tagInput) {
        tagInput.value = 'test-tag'
        tagInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }))
        
        const tagList = document.querySelector('#tag-list')
        const newTag = tagList?.querySelector('.tag-item')
        tests.tagFunctionality = !!newTag
      }

      // Test quick date buttons
      const quickDateButtons = document.querySelectorAll('button[onclick*="quickDate"]')
      tests.quickDateButtons = quickDateButtons.length >= 3 // Today, Tomorrow, Next Week

      //console.log('✅ Task form validation tests completed')
    } catch (error) {
      //console.error('❌ Task form validation tests failed:', error.message)
    }

    return tests
  },

  // Test profile edit form validation
  testProfileEditForm() {
    const tests = {
      fullnameValidation: false,
      usernameValidation: false,
      emailValidation: false,
      passwordValidation: false,
      avatarSelection: false
    }

    try {
      // Test fullname validation
      const fullnameInput = document.querySelector('input[name="fullname"]')
      if (fullnameInput) {
        fullnameInput.value = 'a'
        fullnameInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.fullnameValidation = !!error
      }

      // Test username validation
      const usernameInput = document.querySelector('input[name="username"]')
      if (usernameInput) {
        usernameInput.value = 'ab'
        usernameInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.usernameValidation = !!error
      }

      // Test email validation
      const emailInput = document.querySelector('input[name="email"]')
      if (emailInput) {
        emailInput.value = 'invalid-email'
        emailInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.emailValidation = !!error
      }

      // Test password validation (if changing password)
      const newPasswordInput = document.querySelector('input[name="newPassword"]')
      if (newPasswordInput) {
        newPasswordInput.value = '123'
        newPasswordInput.dispatchEvent(new Event('blur'))
        
        const error = document.querySelector('.invalid-feedback')
        tests.passwordValidation = !!error
      }

      // Test avatar selection
      const avatarThumbs = document.querySelectorAll('.avatar-thumb')
      tests.avatarSelection = avatarThumbs.length >= 10 // Should have multiple avatar options

      //console.log('✅ Profile edit form validation tests completed')
    } catch (error) {
      //console.error('❌ Profile edit form validation tests failed:', error.message)
    }

    return tests
  },

  // Run all form validation tests
  runAllFormTests() {
    //console.log('📝 Starting form validation tests...')
    
    const results = {
      loginForm: this.testLoginForm(),
      signupForm: this.testSignupForm(),
      taskForm: this.testTaskForm(),
      profileEditForm: this.testProfileEditForm(),
      timestamp: new Date().toISOString()
    }

    //console.log('📊 Form validation test results:', results)
    return results
  },

  // Generate form validation report
  generateFormReport(results) {
    const report = {
      summary: {
        totalForms: Object.keys(results).length - 1, // Exclude timestamp
        totalValidations: 0,
        passedValidations: 0,
        failedValidations: 0
      },
      details: results,
      recommendations: []
    }

    // Count validations and analyze results
    Object.entries(results).forEach(([formName, formTests]) => {
      if (formName !== 'timestamp' && typeof formTests === 'object') {
        Object.entries(formTests).forEach(([testName, passed]) => {
          report.summary.totalValidations++
          if (passed) {
            report.summary.passedValidations++
          } else {
            report.summary.failedValidations++
            report.recommendations.push(`${formName}: ${testName} validation needs improvement`)
          }
        })
      }
    })

    // Calculate success rate
    report.summary.successRate = report.summary.totalValidations > 0 
      ? Math.round((report.summary.passedValidations / report.summary.totalValidations) * 100)
      : 0

    return report
  }
}

// Export individual test functions
export const {
  testLoginForm,
  testSignupForm,
  testTaskForm,
  testProfileEditForm,
  runAllFormTests,
  generateFormReport
} = formValidationTests

export default formValidationTests