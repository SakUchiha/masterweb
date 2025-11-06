/**
 * Theme Manager
 * Handles dark/light theme switching across all pages
 */
class ThemeManager {
  constructor() {
    this.themeToggle = null;
    this.currentTheme = this.getPreferredTheme();
    this.init();
  }

  init() {
    // Apply theme immediately
    this.applyTheme(this.currentTheme);

    // Setup theme toggle if it exists
    this.setupThemeToggle();

    // Listen for system theme changes
    this.setupSystemThemeListener();
  }

  getPreferredTheme() {
    const storedTheme = localStorage.getItem("kidlearner-theme");
    if (storedTheme) return storedTheme;

    // If no stored preference, use system preference
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  setupThemeToggle() {
    // Only setup theme toggle on home page (index.html)
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/')) {
      return;
    }

    // Find or create theme toggle
    this.themeToggle = document.getElementById("theme-toggle");

    // If toggle doesn't exist in the current page, don't proceed
    if (!this.themeToggle) return;

    // Set initial state
    this.updateToggleState();

    // Add click event
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
  }

  setupSystemThemeListener() {
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          // Only apply system theme if user hasn't explicitly set a preference
          if (!localStorage.getItem("kidlearner-theme")) {
            this.applyTheme(e.matches ? "dark" : "light");
          }
        });
    }
  }

  applyTheme(theme) {
    // Update document attribute
    document.documentElement.setAttribute("data-theme", theme);
    this.currentTheme = theme;

    // Save preference
    localStorage.setItem("kidlearner-theme", theme);

    // Update toggle UI if it exists
    this.updateToggleState();

    // Update any theme-specific elements
    this.updateThemeElements(theme);
  }

  updateToggleState() {
    if (!this.themeToggle) return;

    // Update toggle button text and aria-label
    const isDark = this.currentTheme === "dark";
    this.themeToggle.innerHTML = isDark ? "☀️" : "🌙";
    this.themeToggle.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`
    );
    this.themeToggle.setAttribute("aria-pressed", isDark);

    // Add smooth transition class
    this.themeToggle.classList.add('theme-transition');
  }

  updateThemeElements(theme) {
    // Update any theme-specific elements here if needed
    const isDark = theme === "dark";

    // Update favicon based on theme
    let favicon = document.querySelector('link[rel="icon"]');

    // If no favicon link exists, create one
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      document.head.appendChild(favicon);
    }

    // Use inline SVG data URIs to avoid extra network requests for favicons
    const lightSvg =
      '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"%3E%3Ccircle cx="8" cy="8" r="7" fill="%23667eea"/%3E%3C/svg%3E';
    const darkSvg =
      '%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"%3E%3Crect width="16" height="16" fill="%23111111"/%3E%3C/svg%3E';

    favicon.href = "data:image/svg+xml;utf8," + (isDark ? darkSvg : lightSvg);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(newTheme);
  }

  // Add theme toggle to navigation
  static addThemeToggleToNavigation() {
    // This will be called by the navigation manager
    const header = document.querySelector(".main-header .container");
    if (header && !document.getElementById("theme-toggle")) {
      const themeToggle = document.createElement("button");
      themeToggle.id = "theme-toggle";
      themeToggle.className = "theme-toggle";
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.setAttribute("aria-label", "Toggle theme");
      themeToggle.setAttribute("title", "Toggle dark/light mode");
      header.appendChild(themeToggle);

      // Initialize the theme toggle if ThemeManager is already instantiated
      if (window.themeManager) {
        window.themeManager.themeToggle = themeToggle;
        window.themeManager.setupThemeToggle();
      }
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Create global theme manager instance and expose ThemeManager class
window.ThemeManager = ThemeManager;
const themeManager = new ThemeManager();
window.themeManager = themeManager;
