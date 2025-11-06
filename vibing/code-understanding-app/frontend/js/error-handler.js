/**
 * Error Handler for KidLearner
 * Provides centralized error handling and user-friendly error messages
 */
class ErrorHandler {
  static handle(error, context = 'general') {
    console.error(`Error in ${context}:`, error);

    // Categorize error types
    const errorType = this.categorizeError(error);

    // Show appropriate user message
    const userMessage = this.getUserMessage(errorType, error);
    this.showErrorToast(userMessage, errorType);

    // Log for debugging (in production, send to error tracking service)
    this.logError(error, context, errorType);

    return errorType;
  }

  static categorizeError(error) {
    if (error.name === 'TypeError') return 'type';
    if (error.name === 'ReferenceError') return 'reference';
    if (error.name === 'SyntaxError') return 'syntax';
    if (error.message && error.message.includes('fetch')) return 'network';
    if (error.message && error.message.includes('Failed to fetch')) return 'network';
    if (error.message && error.message.includes('NetworkError')) return 'network';
    if (error.message && error.message.includes('Ollama')) return 'ai';
    if (error.message && error.message.includes('AI')) return 'ai';
    if (error.message && error.message.includes('localStorage')) return 'storage';
    if (error.message && error.message.includes('QuotaExceededError')) return 'storage';
    if (error.message && error.message.includes('timeout')) return 'timeout';
    if (error.message && error.message.includes('403')) return 'auth';
    if (error.message && error.message.includes('404')) return 'notfound';
    if (error.message && error.message.includes('500')) return 'server';
    return 'general';
  }

  static getUserMessage(errorType, error) {
    const messages = {
      type: 'Something went wrong with the data type. Please try again.',
      reference: 'A required component is missing. Please refresh the page.',
      syntax: 'There\'s a code syntax issue. Please check your code and try again.',
      network: 'Network connection issue. Please check your internet connection and try again.',
      ai: 'AI assistant is temporarily unavailable. Please try again in a few moments.',
      storage: 'Unable to save your progress. Please check your browser storage settings.',
      timeout: 'The request timed out. Please try again.',
      auth: 'Access denied. Please check your permissions.',
      notfound: 'The requested resource was not found. Please try again.',
      server: 'Server error occurred. Please try again later.',
      general: 'An unexpected error occurred. Please try again.'
    };

    return messages[errorType] || messages.general;
  }

  static showErrorToast(message, type = 'error', options = {}) {
    // Use the enhanced UI manager notification system instead
    const uiManager = window.uiManager;
    if (uiManager) {
      const notificationType = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';

      let action = null;
      if (options.retryCallback) {
        action = {
          label: 'Try Again',
          callback: `ErrorHandler.retryLastAction()`
        };
      }

      uiManager.showNotification(message, notificationType, options.duration || 5000, {
        action,
        persistent: options.persistent || false
      });

      // Store retry callback for later use
      if (options.retryCallback) {
        this.lastRetryCallback = options.retryCallback;
      }

      return;
    }

    // Fallback to old toast system if UI manager not available
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `error-toast error-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()" aria-label="Close error message">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Auto remove after specified duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);

    // Add CSS if not already present
    if (!document.getElementById('error-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-toast-styles';
      styles.textContent = `
        .error-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          min-width: 300px;
          max-width: 500px;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        }

        .error-error {
          background: #fee;
          border-left: 4px solid #e74c3c;
        }

        .error-warning {
          background: #fff3cd;
          border-left: 4px solid #f39c12;
        }

        .error-info {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .toast-content i {
          font-size: 18px;
          flex-shrink: 0;
        }

        .error-error .toast-content i { color: #e74c3c; }
        .error-warning .toast-content i { color: #f39c12; }
        .error-info .toast-content i { color: #17a2b8; }

        .toast-content span {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .toast-close:hover,
        .toast-close:focus {
          opacity: 1;
          outline: 2px solid rgba(99, 102, 241, 0.4);
          outline-offset: 2px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .error-toast {
            left: 10px;
            right: 10px;
            min-width: auto;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  static retryLastAction() {
    if (this.lastRetryCallback) {
      this.lastRetryCallback();
      this.lastRetryCallback = null;
    }
  }

  static logError(error, context, type) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      type,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage for debugging (in production, send to server)
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorLog);
      // Keep only last 50 errors
      if (logs.length > 50) logs.shift();
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }

    console.error('Error logged:', errorLog);
  }

  static getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  static clearErrorLogs() {
    localStorage.removeItem('error_logs');
  }

  // Wrap async functions with error handling and recovery
  static async withErrorHandling(fn, context = 'async', options = {}) {
    try {
      return await fn();
    } catch (error) {
      const errorType = this.handle(error, context);

      // Auto-retry for certain error types
      if (options.retryOnError && this.shouldRetry(errorType) && options.maxRetries > 0) {
        return this.retryWithBackoff(fn, context, options);
      }

      throw error; // Re-throw for caller to handle if needed
    }
  }

  // Wrap regular functions with error handling
  static withErrorHandlingSync(fn, context = 'sync', options = {}) {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }

  // Determine if an error type should trigger auto-retry
  static shouldRetry(errorType) {
    const retryableErrors = ['network', 'timeout', 'server'];
    return retryableErrors.includes(errorType);
  }

  // Retry with exponential backoff
  static async retryWithBackoff(fn, context, options, attempt = 1) {
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      return await this.withErrorHandling(fn, context, {
        ...options,
        maxRetries: options.maxRetries - 1
      });
    } catch (error) {
      if (attempt < (options.maxRetries || 3)) {
        return this.retryWithBackoff(fn, context, options, attempt + 1);
      }
      throw error;
    }
  }

  // Enhanced error recovery suggestions
  static getRecoverySuggestions(errorType) {
    const suggestions = {
      network: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ],
      auth: [
        'Log in again',
        'Check your account permissions',
        'Contact support if the problem persists'
      ],
      storage: [
        'Clear your browser cache',
        'Try a different browser',
        'Check available storage space'
      ],
      ai: [
        'AI service is temporarily busy',
        'Try again in a few minutes',
        'Use a simpler query'
      ],
      timeout: [
        'The request took too long',
        'Try again with a smaller request',
        'Check your connection speed'
      ]
    };

    return suggestions[errorType] || ['Please try again', 'Refresh the page if the problem continues'];
  }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  ErrorHandler.handle(event.error, 'global');
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handle(new Error(event.reason), 'promise');
});