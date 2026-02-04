// Form Validation Utilities for Music ConnectZ
// Provides real-time validation with user-friendly error messages

class ValidationManager {
  constructor() {
    this.validators = {
      email: this.validateEmail,
      phone: this.validatePhone,
      url: this.validateURL,
      required: this.validateRequired,
      minLength: this.validateMinLength,
      maxLength: this.validateMaxLength,
      number: this.validateNumber,
      date: this.validateDate,
      password: this.validatePassword,
      match: this.validateMatch
    };
  }

  /**
   * Initialize validation on a form
   */
  initForm(formId, options = {}) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Form #${formId} not found`);
      return;
    }

    const defaultOptions = {
      validateOnBlur: true,
      validateOnInput: false,
      showSuccessIndicator: true,
      preserveDataOnError: true
    };

    const config = { ...defaultOptions, ...options };

    // Get all inputs with validation attributes
    const inputs = form.querySelectorAll('[data-validate]');

    inputs.forEach(input => {
      // Blur validation
      if (config.validateOnBlur) {
        input.addEventListener('blur', () => {
          this.validateField(input, config);
        });
      }

      // Input validation (real-time)
      if (config.validateOnInput) {
        input.addEventListener('input', () => {
          // Only validate if field has been touched
          if (input.classList.contains('touched')) {
            this.validateField(input, config);
          }
        });
      }

      // Mark as touched on first blur
      input.addEventListener('blur', () => {
        input.classList.add('touched');
      }, { once: true });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;
      inputs.forEach(input => {
        if (!this.validateField(input, config)) {
          isValid = false;
        }
      });

      if (isValid) {
        // Trigger custom event for valid form
        const event = new CustomEvent('formValid', {
          detail: { form: form, data: this.getFormData(form) }
        });
        form.dispatchEvent(event);
      } else {
        // Focus first invalid field
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    });

    return form;
  }

  /**
   * Validate a single field
   */
  validateField(field, config = {}) {
    const rules = field.dataset.validate.split('|');
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    for (const rule of rules) {
      const [validatorName, ...params] = rule.split(':');
      const validator = this.validators[validatorName];

      if (!validator) {
        console.warn(`Unknown validator: ${validatorName}`);
        continue;
      }

      const result = validator.call(this, value, ...params, field);
      
      if (!result.valid) {
        isValid = false;
        errorMessage = result.message;
        break;
      }
    }

    // Update UI
    this.updateFieldUI(field, isValid, errorMessage, config);

    return isValid;
  }

  /**
   * Update field UI based on validation result
   */
  updateFieldUI(field, isValid, errorMessage, config) {
    // Remove existing feedback
    field.classList.remove('valid', 'invalid');
    
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    if (isValid) {
      field.classList.add('valid');
      field.setAttribute('aria-invalid', 'false');
      
      // Show success indicator if enabled
      if (config.showSuccessIndicator && field.value) {
        field.classList.add('has-success-icon');
      }
    } else {
      field.classList.add('invalid');
      field.setAttribute('aria-invalid', 'true');
      
      // Create and insert error message
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = errorMessage;
      errorElement.setAttribute('role', 'alert');
      field.parentElement.appendChild(errorElement);
    }
  }

  /**
   * Validate email format
   */
  validateEmail(value) {
    if (!value) {
      return { valid: true }; // Use 'required' validator for required fields
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);

    return {
      valid: isValid,
      message: isValid ? '' : 'Please enter a valid email address'
    };
  }

  /**
   * Validate phone number
   */
  validatePhone(value) {
    if (!value) {
      return { valid: true };
    }

    // Remove non-digit characters
    const digits = value.replace(/\D/g, '');
    const isValid = digits.length >= 10 && digits.length <= 15;

    return {
      valid: isValid,
      message: isValid ? '' : 'Please enter a valid phone number'
    };
  }

  /**
   * Validate URL
   */
  validateURL(value) {
    if (!value) {
      return { valid: true };
    }

    try {
      new URL(value);
      return { valid: true };
    } catch {
      return {
        valid: false,
        message: 'Please enter a valid URL (e.g., https://example.com)'
      };
    }
  }

  /**
   * Validate required field
   */
  validateRequired(value, fieldName) {
    const isValid = value.length > 0;

    return {
      valid: isValid,
      message: isValid ? '' : `${fieldName || 'This field'} is required`
    };
  }

  /**
   * Validate minimum length
   */
  validateMinLength(value, minLength) {
    if (!value) {
      return { valid: true };
    }

    const min = parseInt(minLength);
    const isValid = value.length >= min;

    return {
      valid: isValid,
      message: isValid ? '' : `Must be at least ${min} characters`
    };
  }

  /**
   * Validate maximum length
   */
  validateMaxLength(value, maxLength) {
    if (!value) {
      return { valid: true };
    }

    const max = parseInt(maxLength);
    const isValid = value.length <= max;

    return {
      valid: isValid,
      message: isValid ? '' : `Must not exceed ${max} characters`
    };
  }

  /**
   * Validate number
   */
  validateNumber(value, min, max) {
    if (!value) {
      return { valid: true };
    }

    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return { valid: false, message: 'Please enter a valid number' };
    }

    if (min !== undefined) {
      const minNum = parseFloat(min);
      if (num < minNum) {
        return { valid: false, message: `Must be at least ${minNum}` };
      }
    }

    if (max !== undefined) {
      const maxNum = parseFloat(max);
      if (num > maxNum) {
        return { valid: false, message: `Must not exceed ${maxNum}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate date
   */
  validateDate(value, minDate, maxDate) {
    if (!value) {
      return { valid: true };
    }

    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Please enter a valid date' };
    }

    if (minDate) {
      const min = new Date(minDate);
      if (date < min) {
        return { valid: false, message: `Date must be after ${min.toLocaleDateString()}` };
      }
    }

    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) {
        return { valid: false, message: `Date must be before ${max.toLocaleDateString()}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(value, strength = 'medium') {
    if (!value) {
      return { valid: true };
    }

    const rules = {
      weak: {
        minLength: 6,
        pattern: /.{6,}/,
        message: 'Password must be at least 6 characters'
      },
      medium: {
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        message: 'Password must be 8+ characters with uppercase, lowercase, and number'
      },
      strong: {
        minLength: 12,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/,
        message: 'Password must be 12+ characters with uppercase, lowercase, number, and special character'
      }
    };

    const rule = rules[strength] || rules.medium;
    const isValid = rule.pattern.test(value);

    return {
      valid: isValid,
      message: isValid ? '' : rule.message
    };
  }

  /**
   * Validate field match (e.g., password confirmation)
   */
  validateMatch(value, targetFieldId) {
    const targetField = document.getElementById(targetFieldId);
    
    if (!targetField) {
      console.error(`Target field #${targetFieldId} not found`);
      return { valid: false, message: 'Configuration error' };
    }

    const isValid = value === targetField.value;

    return {
      valid: isValid,
      message: isValid ? '' : 'Fields do not match'
    };
  }

  /**
   * Get form data as object
   */
  getFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      // Handle multiple values (e.g., checkboxes)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Reset form validation state
   */
  resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.reset();

    // Remove validation classes
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach(input => {
      input.classList.remove('valid', 'invalid', 'touched', 'has-success-icon');
      input.removeAttribute('aria-invalid');
    });

    // Remove error messages
    const errors = form.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  }

  /**
   * Validate file upload
   */
  validateFile(file, options = {}) {
    const defaults = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.wav', '.mp4']
    };

    const config = { ...defaults, ...options };

    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        message: `File size must not exceed ${(config.maxSize / 1024 / 1024).toFixed(0)}MB`
      };
    }

    // Check file type
    if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'File type not allowed'
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (config.allowedExtensions && !config.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        message: `Only ${config.allowedExtensions.join(', ')} files are allowed`
      };
    }

    return { valid: true };
  }

  /**
   * Setup file input validation
   */
  setupFileValidation(inputId, options = {}) {
    const input = document.getElementById(inputId);
    if (!input || input.type !== 'file') {
      console.error(`File input #${inputId} not found`);
      return;
    }

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const result = this.validateFile(file, options);
      
      if (!result.valid) {
        // Show error
        this.updateFieldUI(input, false, result.message, {});
        input.value = ''; // Clear invalid file
      } else {
        this.updateFieldUI(input, true, '', {});
      }
    });
  }
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.ValidationManager = ValidationManager;
}
