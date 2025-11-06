// Enhanced UI Features for KidLearner
class EnhancedUI {
  constructor() {
    this.init();
  }

  init() {
    this.setupThemeToggle();
    this.setupFloatingActionButtons();
    this.setupToastNotifications();
    this.setupParticleEffects();
    this.setupScrollAnimations();
    this.setupMicroInteractions();
  }

  // Dark/Light Mode Toggle
  setupThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--glass);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      color: var(--text);
      font-size: 18px;
      cursor: pointer;
      transition: var(--transition);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(themeToggle);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      themeToggle.innerHTML = newTheme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

      this.showToast('Theme updated!', 'success');
    });
  }

  // Floating Action Buttons
  setupFloatingActionButtons() {
    const fabMain = document.getElementById('fab-main');
    const fabAi = document.getElementById('fab-ai');

    if (fabMain) {
      fabMain.addEventListener('click', () => {
        if (fabAi.style.display === 'none' || fabAi.style.display === '') {
          fabAi.style.display = 'flex';
          fabAi.style.animation = 'slideInRight 0.3s ease forwards';
        } else {
          fabAi.style.animation = 'slideInRight 0.3s ease reverse';
          setTimeout(() => fabAi.style.display = 'none', 300);
        }
      });
    }

    if (fabAi) {
      fabAi.addEventListener('click', () => {
        window.location.href = 'ask-ai.html';
      });
    }
  }

  // Toast Notifications System
  setupToastNotifications() {
    this.toastContainer = document.getElementById('toast-container');
  }

  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
      <i class="${icons[type]} toast-icon"></i>
      <span>${message}</span>
      <button class="toast-close" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    const removeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    // Auto remove after duration
    setTimeout(removeToast, duration);
  }

  // Particle Effects
  setupParticleEffects() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 10}s;
        animation-duration: ${6 + Math.random() * 4}s;
      `;
      particlesContainer.appendChild(particle);
    }
  }

  // Scroll-triggered Animations
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const delay = index * 0.1;
          entry.target.style.animationDelay = `${delay}s`;
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe feature cards with stagger
    document.querySelectorAll('.feature-card').forEach((card, index) => {
      card.classList.add(`animate-stagger-${(index % 6) + 1}`);
      observer.observe(card);
    });

    // Observe steps
    document.querySelectorAll('.step').forEach(step => {
      observer.observe(step);
    });
  }

  // Micro-interactions
  setupMicroInteractions() {
    // Button ripple effect
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn') || e.target.closest('.btn')) {
        const button = e.target.classList.contains('btn') ? e.target : e.target.closest('.btn');
        this.createRippleEffect(button, e);
      }
    });

    // Enhanced hover effects for cards
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-12px) scale(1.03) rotateX(5deg)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
      });
    });
  }

  // Ripple effect for buttons
  createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // Loading states
  showLoadingState(element) {
    element.classList.add('loading-skeleton');
    element.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-avatar loading-skeleton"></div>
        <div class="skeleton-text loading-skeleton"></div>
        <div class="skeleton-text loading-skeleton"></div>
        <div class="skeleton-text loading-skeleton"></div>
      </div>
    `;
  }

  hideLoadingState(element) {
    element.classList.remove('loading-skeleton');
  }
}

// CSS for ripple effect
const rippleStyles = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

// Add ripple styles to head
const style = document.createElement('style');
style.textContent = rippleStyles;
document.head.appendChild(style);

// Initialize enhanced UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedUI = new EnhancedUI();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedUI;
}