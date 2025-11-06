// Navigation buttons functionality
class NavigationManager {
  constructor() {
    this.pages = [
      "index.html",
      "lessons.html",
      "editor.html",
      "ai.html",
      "ask-ai.html",
      "code-explainer.html",
      "study-guide.html",
    ];
    this.currentPage = this.getCurrentPage();
    this.mobileMenuOpen = false;
    this.init();
  }

  init() {
    this.createNavigationButtons();
    this.updateButtonStates();
    this.initMobileMenu();
    this.initTouchGestures();
    this.initKeyboardNavigation();
    this.addButtonFeedback();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    return filename;
  }

  createNavigationButtons() {
    // Add theme toggle to navigation if ThemeManager is available
    if (window.ThemeManager && window.ThemeManager.addThemeToggleToNavigation) {
      window.ThemeManager.addThemeToggleToNavigation();
    }

    // Create container
    const navContainer = document.createElement("div");
    navContainer.className = "nav-buttons";

    // Back button
    const backBtn = document.createElement("button");
    backBtn.className = "nav-btn back";
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backBtn.title = "Go Back";
    backBtn.setAttribute("aria-label", "Go to previous page");
    backBtn.onclick = () => this.goBack();

    // Forward button
    const forwardBtn = document.createElement("button");
    forwardBtn.className = "nav-btn forward";
    forwardBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
    forwardBtn.title = "Go Forward";
    forwardBtn.setAttribute("aria-label", "Go to next page");
    forwardBtn.onclick = () => this.goForward();

    // Add buttons to container
    navContainer.appendChild(backBtn);
    navContainer.appendChild(forwardBtn);

    // Add to page
    document.body.appendChild(navContainer);
  }

  updateButtonStates() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    const backBtn = document.querySelector(".nav-btn.back");
    const forwardBtn = document.querySelector(".nav-btn.forward");

    if (backBtn && forwardBtn) {
      // Enable/disable based on position
      backBtn.disabled = currentIndex <= 0;
      forwardBtn.disabled = currentIndex >= this.pages.length - 1;
    }
  }

  goBack() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    if (currentIndex > 0) {
      const prevPage = this.pages[currentIndex - 1];
      this.navigateToPage(prevPage);
    }
  }

  goForward() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    if (currentIndex < this.pages.length - 1) {
      const nextPage = this.pages[currentIndex + 1];
      this.navigateToPage(nextPage);
    }
  }

  navigateToPage(page) {
    // Use client-side routing instead of full page reload
    if (window.router) {
      // Add smooth transition effect
      document.body.style.opacity = "0.7";
      setTimeout(() => {
        window.router.navigate(page);
        document.body.style.opacity = "1";
      }, 150);
    } else {
      // Fallback to traditional navigation
      window.location.href = page;
    }
  }

  initMobileMenu() {
    const menuToggle = document.createElement("button");
    menuToggle.className = "mobile-menu-toggle";
    menuToggle.innerHTML = "&#9776;";
    menuToggle.setAttribute("aria-label", "Toggle menu");
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const mobileNav = document.querySelector(".mobile-nav");
      const toggleBtn = document.querySelector(".mobile-menu-toggle");

      if (
        this.mobileMenuOpen &&
        !mobileNav.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    });

    // Close menu on navigation
    const navLinks = document.querySelectorAll(".mobile-nav .nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => this.closeMobileMenu());
    });
  }

  toggleMobileMenu() {
    const mobileNav = document.querySelector(".mobile-nav");
    const toggleBtn = document.querySelector(".mobile-menu-toggle");

    if (!mobileNav) {
      this.createMobileMenu();
      return;
    }

    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    const mobileNav = document.querySelector(".mobile-nav");
    const toggleBtn = document.querySelector(".mobile-menu-toggle");

    if (mobileNav && toggleBtn) {
      mobileNav.classList.add("open");
      toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
      toggleBtn.setAttribute("aria-expanded", "true");
      this.mobileMenuOpen = true;

      // Focus management for accessibility
      const firstLink = mobileNav.querySelector(".nav-link");
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  createMobileMenu() {
    const mobileNav = document.createElement("nav");
    mobileNav.className = "mobile-nav";

    const navLinks = document.createElement("div");
    navLinks.className = "nav-links";

    // Clone navigation links
    const originalNav = document.querySelector(".main-nav");
    if (originalNav) {
      const links = originalNav.querySelectorAll(".nav-link");
      links.forEach((link) => {
        const clone = link.cloneNode(true);
        navLinks.appendChild(clone);
      });
    }

    mobileNav.appendChild(navLinks);
    document.querySelector(".main-header .container").appendChild(mobileNav);

    // Add event listeners to cloned links
    const clonedLinks = navLinks.querySelectorAll(".nav-link");
    clonedLinks.forEach((link) => {
      link.addEventListener("click", () => this.closeMobileMenu());
    });

    this.openMobileMenu();
  }

  closeMobileMenu() {
    const mobileNav = document.querySelector(".mobile-nav");
    const toggleBtn = document.querySelector(".mobile-menu-toggle");

    if (mobileNav && toggleBtn) {
      mobileNav.classList.remove("open");
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      toggleBtn.setAttribute("aria-expanded", "false");
      this.mobileMenuOpen = false;
    }
  }

  initTouchGestures() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    // Touch start
    document.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      },
      { passive: true }
    );

    // Touch end
    document.addEventListener(
      "touchend",
      (e) => {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        const diffX = startX - endX;
        const diffY = startY - endY;
        const duration = endTime - startTime;

        // Only trigger swipe if it's fast enough and long enough
        const minSwipeDistance = 50;
        const maxSwipeTime = 500; // 500ms

        if (
          Math.abs(diffX) > Math.abs(diffY) &&
          Math.abs(diffX) > minSwipeDistance &&
          duration < maxSwipeTime
        ) {
          if (diffX > 0) {
            // Swipe left - go forward
            this.goForward();
            this.showSwipeFeedback("forward");
          } else {
            // Swipe right - go back
            this.goBack();
            this.showSwipeFeedback("back");
          }

          // Dispatch custom event for haptic feedback
          document.dispatchEvent(new CustomEvent("swipeNavigation"));
        }

        startX = 0;
        startY = 0;
        startTime = 0;
      },
      { passive: true }
    );
  }

  showSwipeFeedback(direction) {
    // Create visual feedback for swipe gestures
    const feedback = document.createElement("div");
    feedback.className = `swipe-feedback swipe-${direction}`;
    feedback.innerHTML =
      direction === "forward"
        ? '<i class="fas fa-arrow-right"></i>'
        : '<i class="fas fa-arrow-left"></i>';

    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      ${direction === "forward" ? "right: 20px;" : "left: 20px;"}
      transform: translateY(-50%);
      background: var(--primary);
      color: white;
      padding: 10px 15px;
      border-radius: 50px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: swipeFeedback 0.5s ease-out;
      pointer-events: none;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 500);
  }

  // Add visual feedback for navigation buttons
  addButtonFeedback() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => {
          btn.style.transform = "";
        }, 150);
      });
    });
  }

  initKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Alt + Left/Right arrow for navigation
      if (e.altKey) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.goBack();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.goForward();
        }
      }

      // Escape key to close mobile menu
      if (e.key === "Escape" && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new NavigationManager();
});
