/**
 * Client-Side Router
 * Handles navigation without full page reloads
 */
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.contentContainer = null;
    this.init();
  }

  init() {
    // Set up content container (main content area)
    this.contentContainer = document.querySelector('main') || document.body;

    // Set up routes
    this.setupRoutes();

    // Listen for navigation events first
    this.setupEventListeners();

    // Handle initial load
    this.handleInitialLoad();
  }

  setupRoutes() {
    // Define routes and their corresponding HTML files
    const routes = [
      { path: '/', file: 'index.html' },
      { path: '/index.html', file: 'index.html' },
      { path: '/lessons.html', file: 'lessons.html' },
      { path: '/editor.html', file: 'editor.html' },
      { path: '/ai.html', file: 'ai.html' },
      { path: '/ask-ai.html', file: 'ask-ai.html' },
      { path: '/code-explainer.html', file: 'code-explainer.html' },
      { path: '/study-guide.html', file: 'study-guide.html' },
      { path: '/lesson-viewer.html', file: 'lesson-viewer.html' },
      { path: '/contact.html', file: 'contact.html' }
    ];

    routes.forEach(route => {
      this.routes.set(route.path, route.file);
    });
  }

  handleInitialLoad() {
    const currentPath = window.location.pathname;
    const route = this.getRouteFromPath(currentPath);

    if (route) {
      this.currentRoute = route;
      // For initial load, we don't need to load content as it's already there
      this.updateNavigationState(route);
    }
  }

  setupEventListeners() {
    // Intercept navigation link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.shouldInterceptLink(link)) {
        e.preventDefault();
        const path = link.getAttribute('href');
        this.navigate(path);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const path = window.location.pathname;
      this.loadRoute(path, false); // Don't push state again
    });

    // Listen for route change events from other components
    document.addEventListener('routeChanged', (e) => {
      // Update navigation state when route changes
      this.updateNavigationState(e.detail.route);
    });
  }

  shouldInterceptLink(link) {
    const href = link.getAttribute('href');
    if (!href) return false;

    // Only intercept internal links (not external or anchors)
    if (href.startsWith('http') || href.startsWith('//')) return false;
    if (href.startsWith('#')) return false;
    if (href.includes('mailto:') || href.includes('tel:')) return false;

    // Check if it's a route we handle
    return this.routes.has(href) || this.routes.has('/' + href);
  }

  navigate(path, pushState = true) {
    // Normalize path
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Load the route
    this.loadRoute(path, pushState);
  }

  loadRoute(path, pushState = true) {
    const route = this.getRouteFromPath(path);
    if (!route) {
      console.warn('Route not found:', path);
      return;
    }

    // Update browser history
    if (pushState) {
      window.history.pushState({ path }, '', path);
    }

    // Load page content
    this.loadPageContent(route)
      .then(() => {
        this.currentRoute = route;
        this.updateNavigationState(route);
        this.scrollToTop();

        // Dispatch custom event for other components to react
        document.dispatchEvent(new CustomEvent('routeChanged', {
          detail: { route, path }
        }));
      })
      .catch(error => {
        console.error('Failed to load route:', error);
        // Fallback to traditional navigation
        window.location.href = path;
      });
  }

  async loadPageContent(route) {
    try {
      const response = await fetch(route);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract the main content from the HTML
      const content = this.extractMainContent(html);

      // Update the page content
      this.updatePageContent(content);

      // Update page title
      this.updatePageTitle(html);

      // Execute any scripts in the loaded content
      this.executeScripts(content);

      // Reinitialize components that need to run on new pages
      this.reinitializeComponents();

    } catch (error) {
      throw error;
    }
  }

  extractMainContent(html) {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try to find the main content area
    let mainContent = doc.querySelector('main');
    if (!mainContent) {
      // Fallback: find content between header and footer
      const header = doc.querySelector('header, .main-header');
      const footer = doc.querySelector('footer, .main-footer');

      if (header && footer) {
        mainContent = document.createElement('div');
        let currentNode = header.nextElementSibling;
        while (currentNode && currentNode !== footer) {
          mainContent.appendChild(currentNode.cloneNode(true));
          currentNode = currentNode.nextElementSibling;
        }
      } else {
        // Last resort: get body content excluding header/footer
        mainContent = doc.querySelector('body');
        if (mainContent) {
          // Remove header and footer if they exist
          const headerToRemove = mainContent.querySelector('header, .main-header');
          const footerToRemove = mainContent.querySelector('footer, .main-footer');
          if (headerToRemove) headerToRemove.remove();
          if (footerToRemove) footerToRemove.remove();
        }
      }
    }

    // If we still don't have content, try to get everything after the header
    if (!mainContent || !mainContent.innerHTML.trim()) {
      const header = doc.querySelector('header, .main-header');
      if (header) {
        mainContent = document.createElement('div');
        let currentNode = header.nextElementSibling;
        while (currentNode) {
          if (!currentNode.matches('footer, .main-footer')) {
            mainContent.appendChild(currentNode.cloneNode(true));
          }
          currentNode = currentNode.nextElementSibling;
        }
      }
    }

    return mainContent ? mainContent.innerHTML : html;
  }

  updatePageContent(content) {
    // Find the main content container
    let container = document.querySelector('main');
    if (!container) {
      // Create main element if it doesn't exist
      container = document.createElement('main');
      // Insert after header
      const header = document.querySelector('header, .main-header');
      if (header) {
        header.insertAdjacentElement('afterend', container);
      } else {
        document.body.insertBefore(container, document.body.firstChild);
      }
    }

    // Clear existing content
    container.innerHTML = '';

    // Add new content
    container.innerHTML = content;
  }

  updatePageTitle(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const title = doc.querySelector('title');

    if (title && title.textContent) {
      document.title = title.textContent;
    }
  }

  executeScripts(content) {
    // Extract and execute any inline scripts from the loaded content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        // External script - load it if not already loaded
        const existingScript = document.querySelector(`script[src="${script.src}"]`);
        if (!existingScript) {
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.defer = true; // Add defer to prevent blocking
          document.head.appendChild(newScript);
        }
      } else if (script.textContent.trim()) {
        // Inline script - execute it safely
        try {
          // Use Function constructor instead of eval for better security
          const func = new Function(script.textContent);
          func();
        } catch (error) {
          console.error('Error executing inline script:', error);
        }
      }
    });
  }

  updateNavigationState(route) {
    // Update active navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === route || href === '/' + route) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Update navigation manager if it exists
    if (window.navigationManager) {
      window.navigationManager.currentPage = route;
      window.navigationManager.updateButtonStates();
    }

    // Update theme toggle if it exists (reinitialize for new page)
    if (window.themeManager) {
      window.themeManager.setupThemeToggle();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getRouteFromPath(path) {
    // Normalize path
    if (path === '/' || path === '') {
      return 'index.html';
    }

    // Remove leading slash
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    return this.routes.get('/' + path) || this.routes.get(path);
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  // Method to programmatically navigate
  goTo(path) {
    this.navigate(path);
  }

  // Method to go back
  goBack() {
    window.history.back();
  }

  // Method to go forward
  goForward() {
    window.history.forward();
  }

  // Reinitialize components after page load
  reinitializeComponents() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Reinitialize navigation if needed
      if (window.navigationManager) {
        window.navigationManager.init();
      }

      // Reinitialize theme manager
      if (window.themeManager) {
        window.themeManager.init();
      }

      // Reinitialize app if it exists
      if (window.kidLearnerApp) {
        window.kidLearnerApp.initComponents();
      }

      // Dispatch a custom event to notify other components
      document.dispatchEvent(new CustomEvent('pageLoaded', {
        detail: { route: this.currentRoute }
      }));
    }, 50);
  }
}

// Create global router instance
const router = new Router();
window.router = router;

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}