/**
 * Main Application Module
 * Initializes and coordinates all application components
 */
class KidLearnerApp {
  constructor() {
    this.initialized = false;
    this.components = new Map();
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log("Initializing KidLearner application...");

      // Initialize core components in order
      await this.initConfig();
      await this.initErrorBoundary();
      await this.initAPI();
      await this.initUI();
      await this.initComponents();

      // Check API availability
      await this.checkAPIHealth();

      // Mark as initialized
      this.initialized = true;

      console.log("KidLearner application initialized successfully");

      // Show welcome message
      // uiManager.showSuccess('Application loaded successfully!');
    } catch (error) {
      console.error("Failed to initialize application:", error);
      this.handleInitError(error);
    }
  }

  /**
   * Initialize configuration
   */
  async initConfig() {
    // Config is already loaded globally
    if (!window.CONFIG) {
      throw new Error("Configuration not loaded");
    }
    console.log("Configuration loaded");
  }

  /**
   * Initialize error boundary
   */
  async initErrorBoundary() {
    if (!window.errorBoundary) {
      throw new Error("Error boundary not loaded");
    }
    // Error boundary initializes itself
    console.log("Error boundary initialized");
  }

  /**
   * Initialize API service
   */
  async initAPI() {
    if (!window.apiService) {
      throw new Error("API service not loaded");
    }
    console.log("API service initialized");
  }

  /**
   * Initialize UI manager
   */
  async initUI() {
    if (!window.uiManager) {
      throw new Error("UI manager not loaded");
    }
    // UI manager initializes itself
    console.log("UI manager initialized");
  }

  /**
   * Initialize page-specific components
   */
  async initComponents() {
    const page = this.getCurrentPage();

    switch (page) {
      case "index":
        // Home page - initialize progress display
        this.initProgressDisplay();
        break;

      case "lessons":
        // Lessons page - initialize lesson loading
        if (typeof loadLessons === "function") {
          loadLessons();
        }
        this.initProgressTracking();
        break;

      case "editor":
        // Editor page - editor initializes itself
        this.initProgressTracking();
        break;

      case "ai":
        // AI page - AI assistant initializes itself
        this.initProgressTracking();
        break;

      case "study-guide":
        // Study guide - initialize progress display
        this.initProgressDisplay();
        break;

      case "lesson-viewer":
        // Lesson viewer - may need lesson loading
        this.initProgressTracking();
        break;
    }

    console.log(`Components initialized for page: ${page}`);
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    try {
      const isHealthy = await apiService.checkAvailability();
      if (!isHealthy) {
        uiManager.showNotification(
          "Backend service is not available. Some features may not work properly.",
          "warning"
        );
      }
    } catch (error) {
      console.warn("API health check failed:", error);
      uiManager.showNotification(
        "Unable to connect to backend services. Please check your connection.",
        "warning"
      );
    }
  }

  /**
   * Get current page based on URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";

    // Map filenames to page types
    const pageMap = {
      "index.html": "index",
      "lessons.html": "lessons",
      "editor.html": "editor",
      "ai.html": "ai",
      "study-guide.html": "study-guide",
      "lesson-viewer.html": "lesson-viewer",
    };

    return pageMap[filename] || "unknown";
  }

  /**
   * Handle initialization errors
   */
  handleInitError(error) {
    console.error("Application initialization failed:", error);

    // Show critical error message
    const errorMessage = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
        <h2>Application Failed to Load</h2>
        <p>Sorry, we encountered an error while loading the application.</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
          <i class="fas fa-refresh"></i> Reload Application
        </button>
      </div>
    `;

    // Try to show error in UI, fallback to alert
    if (window.uiManager) {
      uiManager.showNotification(errorMessage, "error", 0);
    } else {
      alert("Application failed to load. Please refresh the page.");
    }
  }

  /**
   * Register a component
   */
  registerComponent(name, component) {
    this.components.set(name, component);
  }

  /**
   * Get a registered component
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Check if application is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Initialize progress display components
   */
  initProgressDisplay() {
    if (window.progressTracker && window.gamificationSystem) {
      // Add progress dashboard to the page
      this.createProgressDashboard();
    }
  }

  /**
   * Initialize progress tracking for interactive pages
   */
  initProgressTracking() {
    if (window.progressTracker) {
      // Check daily goals and show reminders
      window.progressTracker.checkDailyGoals();

      // Track time spent on page
      this.startTimeTracking();
    }
  }

  /**
   * Start tracking time spent on current page
   */
  startTimeTracking() {
    this.pageStartTime = Date.now();
    this.timeTrackingInterval = setInterval(() => {
      const timeSpent = Math.floor(
        (Date.now() - this.pageStartTime) / 1000 / 60
      ); // minutes
      if (timeSpent >= 1 && window.progressTracker) {
        window.progressTracker.addTimeSpent(1);
        this.pageStartTime = Date.now(); // Reset for next minute
      }
    }, 60000); // Check every minute
  }

  /**
   * Create and display progress dashboard
   */
  createProgressDashboard() {
    const stats = window.progressTracker.getStats();
    const levelInfo = window.gamificationSystem.getCurrentLevel();
    const levelProgress = window.gamificationSystem.getLevelProgress();

    // Create dashboard container
    const dashboard = document.createElement("div");
    dashboard.id = "progress-dashboard";
    dashboard.className = "progress-dashboard";
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h3>📊 Your Learning Progress</h3>
        <div class="level-display">
          <span class="level-badge">${levelInfo.badge}</span>
          <span class="level-text">Level ${stats.level.level}: ${
      stats.level.name
    }</span>
        </div>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">${stats.lessonsCompleted}</div>
          <div class="stat-label">Lessons</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${stats.averageQuizScore.toFixed(0)}%</div>
          <div class="stat-label">Avg Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${stats.currentStreak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">${stats.points}</div>
          <div class="stat-label">Points</div>
        </div>
      </div>

      <div class="level-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${
            levelProgress.current
          }%"></div>
        </div>
        <div class="progress-text">${
          levelProgress.remaining > 0
            ? `${levelProgress.remaining} points to next level`
            : "Max level reached!"
        }</div>
      </div>

      <div class="recent-achievements">
        <h4>🏆 Recent Achievements</h4>
        <div class="achievement-list">
          ${stats.achievements
            .slice(-3)
            .map(
              (achievement) => `
            <div class="achievement-item">
              <span class="achievement-icon">${achievement.icon}</span>
              <span class="achievement-name">${achievement.name}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    // Insert dashboard into the page (before features section)
    const featuresSection = document.querySelector(".features");
    if (featuresSection) {
      featuresSection.parentNode.insertBefore(dashboard, featuresSection);
    }
  }

  /**
   * Get application info
   */
  getInfo() {
    return {
      version: "1.0.0",
      initialized: this.initialized,
      page: this.getCurrentPage(),
      config: CONFIG,
      components: Array.from(this.components.keys()),
      progressTracking: !!window.progressTracker,
      gamification: !!window.gamificationSystem,
    };
  }
}

// Create global application instance
const kidLearnerApp = new KidLearnerApp();
window.kidLearnerApp = kidLearnerApp;

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  kidLearnerApp.init();
});

// Service Worker registration + update handling
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      // If there's already a waiting worker, prompt the user
      if (reg.waiting) {
        showUpdateUI(reg);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateUI(reg);
          }
        });
      });
    })
    .catch((err) => {
      console.warn("ServiceWorker registration failed:", err);
    });

  // When the active service worker changes, reload the page to get the new content
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

function showUpdateUI(reg) {
  // Create a small toast/banner to notify the user
  if (document.getElementById("sw-update-toast")) return;

  const toast = document.createElement("div");
  toast.id = "sw-update-toast";
  toast.style.position = "fixed";
  toast.style.right = "20px";
  toast.style.bottom = "20px";
  toast.style.background = "var(--card, #fff)";
  toast.style.color = "var(--text, #111)";
  toast.style.border = "1px solid rgba(0,0,0,0.08)";
  toast.style.padding = "12px 14px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
  toast.style.zIndex = 10000;
  toast.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="flex:1">A new version is available.</div>
      <button id="sw-update-btn" style="background:#4f46e5;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer">Refresh</button>
      <button id="sw-update-dismiss" style="background:transparent;color:#666;border:none;padding:6px 8px;border-radius:6px;cursor:pointer">Dismiss</button>
    </div>
  `;
  document.body.appendChild(toast);

  const updateBtn = document.getElementById("sw-update-btn");
  const dismissBtn = document.getElementById("sw-update-dismiss");

  updateBtn.addEventListener("click", () => {
    if (!reg || !reg.waiting) return;
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  });

  dismissBtn.addEventListener("click", () => {
    toast.remove();
  });
}

// Export for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = KidLearnerApp;
}
