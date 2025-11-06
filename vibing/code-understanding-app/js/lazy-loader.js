/**
 * Lazy Loading Module
 * Implements lazy loading for images and components to improve performance
 */

class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Create Intersection Observer for lazy loading
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    this.observeImages();
    this.observeComponents();
  }

  /**
   * Observe all images with data-src attribute
   */
  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      this.observer.observe(img);
    });
  }

  /**
   * Observe components that should be loaded lazily
   */
  observeComponents() {
    // Observe lesson cards
    const lessonCards = document.querySelectorAll('.lesson-card[data-lazy]');
    lessonCards.forEach(card => {
      this.observer.observe(card);
    });

    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card[data-lazy]');
    featureCards.forEach(card => {
      this.observer.observe(card);
    });
  }

  /**
   * Load an element when it comes into view
   */
  loadElement(element) {
    if (element.tagName === 'IMG') {
      this.loadImage(element);
    } else if (element.classList.contains('lesson-card')) {
      this.loadLessonCard(element);
    } else if (element.classList.contains('feature-card')) {
      this.loadFeatureCard(element);
    }

    // Stop observing this element
    this.observer.unobserve(element);
  }

  /**
   * Load lazy image
   */
  loadImage(img) {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    }
  }

  /**
   * Load lesson card content
   */
  loadLessonCard(card) {
    // Add animation class
    card.classList.add('animate-in');
    card.removeAttribute('data-lazy');
  }

  /**
   * Load feature card content
   */
  loadFeatureCard(card) {
    // Add animation class
    card.classList.add('animate-in');
    card.removeAttribute('data-lazy');
  }

  /**
   * Preload critical resources
   */
  preloadCritical() {
    // Preload critical CSS
    const criticalCSS = document.querySelector('link[rel="stylesheet"]');
    if (criticalCSS) {
      criticalCSS.rel = 'preload';
      criticalCSS.as = 'style';
      criticalCSS.onload = function() {
        this.rel = 'stylesheet';
      };
    }

    // Preload critical JS
    const criticalJS = document.querySelector('script[src*="main"]');
    if (criticalJS) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = criticalJS.src;
      document.head.appendChild(link);
    }
  }

  /**
   * Load non-critical resources after page load
   */
  loadNonCritical() {
    // Load additional stylesheets
    const additionalStyles = [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ];

    additionalStyles.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });

    // Load additional scripts
    const additionalScripts = [
      // Add any additional scripts here
    ];

    additionalScripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      document.body.appendChild(script);
    });
  }
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.lazyLoader = new LazyLoader();

  // Preload critical resources
  window.lazyLoader.preloadCritical();

  // Load non-critical resources after initial load
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.lazyLoader.loadNonCritical();
    }, 100);
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}