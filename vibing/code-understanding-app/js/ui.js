/**
 * UI Utilities Module
 * Handles loading states, notifications, and common UI interactions
 */
class UIManager {
  constructor() {
    this.loadingElements = new Set();
    this.notifications = [];
  }

  /**
   * Show loading state for an element
   * @param {string} elementId - Element ID to show loading for
   * @param {string} message - Loading message
   * @param {string} type - Loading type: 'spinner', 'skeleton', 'pulse', 'dots', 'overlay'
   */
  showLoading(elementId, message = 'Loading...', type = 'spinner') {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Prevent multiple loading states
    if (this.loadingElements.has(elementId)) return;
    this.loadingElements.add(elementId);

    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);
    element.setAttribute('aria-busy', 'true');

    if (type === 'skeleton') {
      element.innerHTML = this.createSkeletonLoader(elementId);
    } else if (type === 'pulse') {
      element.classList.add('loading-pulse');
      element.setAttribute('aria-busy', 'true');
      return; // Don't replace content for pulse
    } else if (type === 'dots') {
      element.innerHTML = `
        <div class="loading-dots" role="status" aria-label="${message}">
          <span></span><span></span><span></span>
          <span class="sr-only">${message}</span>
        </div>
      `;
    } else if (type === 'overlay') {
      this.showLoadingOverlay(message);
      return;
    } else {
      // Default spinner
      element.innerHTML = `
        <div class="loading-spinner" role="status" aria-label="${message}">
          <div class="spinner" aria-hidden="true"></div>
          <span>${message}</span>
        </div>
      `;
    }

    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
    element.setAttribute('aria-label', message);
  }

  /**
   * Hide loading state for an element
   * @param {string} elementId - Element ID to hide loading for
   */
  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!this.loadingElements.has(elementId)) return;
    this.loadingElements.delete(elementId);

    const originalContent = element.getAttribute('data-original-content');
    if (originalContent !== null) {
      element.innerHTML = originalContent;
      element.removeAttribute('data-original-content');
    }

    element.classList.remove('loading', 'loading-pulse');
    element.removeAttribute('aria-busy');
    element.removeAttribute('aria-label');
  }

  /**
   * Create skeleton loader for specific element types
   * @param {string} elementId - Element ID to create skeleton for
   * @returns {string} HTML string for skeleton loader
   */
  createSkeletonLoader(elementId) {
    if (elementId === 'lessonsGrid') {
      return `
        <div class="skeleton-grid">
          ${Array(6).fill().map(() => `
            <div class="skeleton-lesson-card">
              <div class="skeleton-header">
                <div class="skeleton-category skeleton"></div>
                <div class="skeleton-meta">
                  <div class="skeleton-badge skeleton"></div>
                  <div class="skeleton-badge skeleton"></div>
                </div>
              </div>
              <div class="skeleton-content">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-summary skeleton"></div>
                <div class="skeleton-description skeleton"></div>
                <div class="skeleton-description skeleton"></div>
                <div class="skeleton-description skeleton"></div>
                <div class="skeleton-objectives">
                  <div class="skeleton-objective skeleton"></div>
                  <div class="skeleton-objective skeleton"></div>
                  <div class="skeleton-objective skeleton"></div>
                </div>
              </div>
              <div class="skeleton-footer">
                <div class="skeleton-hints">
                  <div class="skeleton-avatar skeleton"></div>
                  <div class="skeleton-hint-text skeleton"></div>
                </div>
                <div class="skeleton-button skeleton"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Default skeleton
    return `
      <div class="skeleton-card">
        <div class="skeleton-title skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-button skeleton"></div>
      </div>
    `;
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   * @param {Object} options - Additional options (action, persistent, etc.)
   */
  showNotification(message, type = 'info', duration = 5000, options = {}) {
    // Remove existing notification of same type if any (unless persistent)
    if (!options.persistent) {
      this.notifications = this.notifications.filter(n => n.type !== type || n.element);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    let actionButton = '';
    if (options.action) {
      actionButton = `<button class="notification-action" onclick="${options.action.callback}">${options.action.label}</button>`;
    }

    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}" aria-hidden="true"></i>
        <span>${message}</span>
        ${actionButton}
        <button class="notification-close" onclick="uiManager.hideNotification(this)" aria-label="Close notification">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    `;

    // Notification container creation removed as per user request
    // Notifications will not be displayed

    // Store notification info
    const notificationInfo = {
      element: notification,
      type,
      timeout: options.persistent ? null : setTimeout(() => this.hideNotification(notification), duration)
    };
    this.notifications.push(notificationInfo);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Focus management for accessibility
    if (options.focus) {
      notification.focus();
    }
  }

  /**
   * Hide a notification
   * @param {HTMLElement} notificationElement - Notification element to hide
   */
  hideNotification(notificationElement) {
    const notificationInfo = this.notifications.find(n => n.element === notificationElement);
    if (notificationInfo) {
      clearTimeout(notificationInfo.timeout);
      this.notifications = this.notifications.filter(n => n !== notificationInfo);
    }

    notificationElement.classList.remove('show');
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.parentNode.removeChild(notificationElement);
      }
    }, 300);
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon class
   */
  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show error message with retry option
   * @param {string} message - Error message
   * @param {Function} retryCallback - Retry callback function
   * @param {Object} options - Additional options
   */
  showError(message, retryCallback = null, options = {}) {
    const action = retryCallback ? {
      label: 'Try Again',
      callback: `uiManager.hideNotification(this.parentElement.parentElement); (${retryCallback.toString()})()`
    } : null;

    this.showNotification(message, 'error', options.duration || 10000, {
      action,
      persistent: options.persistent || false
    });
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   * @param {Object} options - Additional options
   */
  showWarning(message, options = {}) {
    this.showNotification(message, 'warning', options.duration || 7000, options);
  }

  /**
   * Show info message
   * @param {string} message - Info message
   * @param {Object} options - Additional options
   */
  showInfo(message, options = {}) {
    this.showNotification(message, 'info', options.duration || 5000, options);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show progress indicator with smooth animations
   * @param {string} elementId - Element ID to show progress on
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} options - Animation options
   */
  showAnimatedProgress(elementId, progress, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Create or update progress bar
    let progressBar = element.querySelector('.animated-progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'animated-progress-bar';
      progressBar.innerHTML = `
        <div class="progress-track">
          <div class="progress-fill"></div>
          <div class="progress-glow"></div>
        </div>
        <div class="progress-text">${progress}%</div>
      `;
      element.appendChild(progressBar);
    }

    const fill = progressBar.querySelector('.progress-fill');
    const glow = progressBar.querySelector('.progress-glow');
    const text = progressBar.querySelector('.progress-text');

    // Animate progress
    fill.style.width = `${progress}%`;
    glow.style.width = `${progress}%`;
    text.textContent = `${Math.round(progress)}%`;

    // Add completion animation
    if (progress >= 100 && options.onComplete) {
      setTimeout(() => {
        progressBar.classList.add('completed');
        options.onComplete();
      }, 500);
    }
  }

  /**
   * Create floating action feedback
   * @param {string} message - Feedback message
   * @param {string} type - Feedback type (success, error, info)
   */
  showFloatingFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `floating-feedback ${type}`;
    feedback.innerHTML = `
      <i class="fas ${this.getFeedbackIcon(type)}"></i>
      <span>${message}</span>
    `;

    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'});
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: floatingFeedback 3s ease-out;
      pointer-events: none;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 3000);
  }

  /**
   * Get feedback icon based on type
   * @param {string} type - Feedback type
   * @returns {string} Icon class
   */
  getFeedbackIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };
    return icons[type] || icons.info;
  }

  /**
   * Toggle element visibility
   * @param {string} elementId - Element ID
   * @param {boolean} show - Whether to show or hide
   */
  toggleVisibility(elementId, show = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (show === null) {
      show = element.style.display === 'none';
    }

    element.style.display = show ? 'block' : 'none';
  }

  /**
   * Smooth scroll to element
   * @param {string} elementId - Element ID to scroll to
   */
  scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Enable/disable button with loading state
   * @param {string} buttonId - Button element ID
   * @param {boolean} disabled - Whether to disable
   * @param {string} loadingText - Loading text
   */
  setButtonLoading(buttonId, disabled = true, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.disabled = disabled;

    if (disabled) {
      const originalText = button.textContent;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
      }
    }
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector('p').textContent = message;
      overlay.style.display = 'flex';
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show progress bar
   * @param {string} containerId - Container element ID
   * @param {number} progress - Progress percentage (0-100)
   */
  showProgress(containerId, progress) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let progressBar = container.querySelector('.progress-container');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'progress-container';
      progressBar.innerHTML = '<div class="progress-fill"></div>';
      container.appendChild(progressBar);
    }

    const fill = progressBar.querySelector('.progress-fill');
    fill.style.setProperty('--progress', `${progress}%`);
    fill.style.width = `${progress}%`;
  }

  /**
   * Show circular progress
   * @param {string} containerId - Container element ID
   * @param {number} progress - Progress percentage (0-100)
   */
  showCircularProgress(containerId, progress) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let circularProgress = container.querySelector('.circular-progress');
    if (!circularProgress) {
      circularProgress = document.createElement('div');
      circularProgress.className = 'circular-progress';
      circularProgress.innerHTML = `
        <svg>
          <circle class="bg" cx="30" cy="30" r="25"></circle>
          <circle class="progress" cx="30" cy="30" r="25"></circle>
        </svg>
      `;
      container.appendChild(circularProgress);
    }

    const circle = circularProgress.querySelector('.progress');
    const circumference = 2 * Math.PI * 25;
    const offset = circumference - (progress / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  /**
   * Clear all loading states
   */
  clearAllLoading() {
    this.loadingElements.forEach(elementId => {
      this.hideLoading(elementId);
    });
    this.loadingElements.clear();
    this.hideLoadingOverlay();
  }

  /**
   * Theme management functionality
   */
  initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Get saved theme or detect system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Set initial theme
    this.setTheme(initialTheme);

    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Set theme and update UI
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle?.querySelector('i');

    // Add transition class for smooth theme change
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }

    // Trigger page transition animation
    document.body.classList.add('page-enter');
    setTimeout(() => {
      document.body.classList.remove('page-enter');
    }, 500);
  }

  /**
   * Initialize enhanced animations
   */
  initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Add staggered animation delay for multiple cards
          const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
          entry.target.style.animationDelay = `${index * 0.1}s`;
        }
      });
    }, observerOptions);

    // Observe elements for animations
    document.querySelectorAll('.feature-card, .step, .stat-card, .lesson-card, .path-card').forEach(el => {
      observer.observe(el);
    });

    // Add click animations to interactive elements
    document.addEventListener('click', (e) => {
      // Ensure e.target is a valid DOM element before using closest
      if (e.target && e.target.closest && typeof e.target.closest === 'function') {
        const target = e.target.closest('.btn, .nav-link, .feature-card, .lesson-card, .path-card');
        if (target && !target.classList.contains('loading')) {
          this.addClickAnimation(target);
        }
      }
    });

    // Add hover animations
    document.addEventListener('mouseenter', (e) => {
      // Ensure e.target is a valid DOM element before using closest
      if (e.target && e.target.closest && typeof e.target.closest === 'function') {
        const target = e.target.closest('.btn, .nav-link, .feature-card, .lesson-card');
        if (target) {
          target.style.transform = 'scale(1.02)';
          target.style.transition = 'transform 0.2s ease';
        }
      }
    });

    document.addEventListener('mouseleave', (e) => {
      // Ensure e.target is a valid DOM element before using closest
      if (e.target && e.target.closest && typeof e.target.closest === 'function') {
        const target = e.target.closest('.btn, .nav-link, .feature-card, .lesson-card');
        if (target) {
          target.style.transform = '';
        }
      }
    });

    // Add touch feedback for mobile
    document.addEventListener('touchstart', (e) => {
      if (e.target && e.target.closest && typeof e.target.closest === 'function') {
        const target = e.target.closest('.btn, .nav-link, .feature-card, .lesson-card');
        if (target && !target.classList.contains('loading')) {
          target.style.transform = 'scale(0.98)';
          target.style.transition = 'transform 0.1s ease';
        }
      }
    });

    document.addEventListener('touchend', (e) => {
      if (e.target && e.target.closest && typeof e.target.closest === 'function') {
        const target = e.target.closest('.btn, .nav-link, .feature-card, .lesson-card');
        if (target) {
          target.style.transform = '';
        }
      }
    });
  }

  /**
   * Add click animation to element
   * @param {HTMLElement} element - Element to animate
   */
  addClickAnimation(element) {
    // Remove existing animation
    element.style.animation = 'none';

    // Force reflow
    element.offsetHeight;

    // Add click animation
    element.style.animation = 'clickFeedback 0.3s ease-out';

    // Clean up animation
    setTimeout(() => {
      element.style.animation = '';
    }, 300);
  }

  /**
   * Initialize UI components
   */
  init() {
    // Initialize theme management
    this.initTheme();

    // Initialize enhanced animations
    this.initAnimations();

    // Add notification styles if not present
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
        }
        .notification {
          background: var(--card);
          border-radius: 8px;
          box-shadow: var(--shadow);
          margin-bottom: 10px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          border-left: 4px solid;
          color: var(--text);
        }
        .notification.show {
          transform: translateX(0);
        }
        .notification-success { border-left-color: var(--success); }
        .notification-error { border-left-color: var(--danger); }
        .notification-warning { border-left-color: var(--warning); }
        .notification-info { border-left-color: var(--primary); }
        .notification-content {
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .notification-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          margin-left: auto;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .notification-close:hover,
        .notification-close:focus {
          background: var(--surface);
          outline: 2px solid rgba(99, 102, 241, 0.4);
          outline-offset: 2px;
        }

        .notification-action {
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-right: 8px;
          transition: all 0.2s;
        }

        .notification-action:hover,
        .notification-action:focus {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          outline: 2px solid rgba(99, 102, 241, 0.4);
          outline-offset: 2px;
        }
        .loading-spinner {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 20px;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top: 2px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .error-message {
          color: var(--danger);
          font-weight: 500;
        }
        .retry-btn {
          background: var(--danger);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
        }
      `;
      document.head.appendChild(styles);
    }
  }
}

// Create global UI manager instance
const uiManager = new UIManager();
window.uiManager = uiManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  uiManager.init();
});