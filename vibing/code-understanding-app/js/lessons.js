// Lessons page functionality
document.addEventListener("DOMContentLoaded", function () {
  // Fetch lessons from API
  let lessons = [];

  async function fetchLessons() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/lessons`);
      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }
      lessons = await response.json();

      // Add default thumbnails for lessons using Font Awesome icons
      lessons = lessons.map((lesson) => ({
        ...lesson,
        progress: 0,
        level: lesson.difficulty,
        icon:
          lesson.category === "HTML"
            ? "fab fa-html5"
            : lesson.category === "CSS"
            ? "fab fa-css3-alt"
            : "fab fa-js",
      }));

      displayLessons(lessons);
      updateProgressStats(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      showError("Failed to load lessons. Please try again.");
    }
  }

  // DOM Elements
  const lessonsGrid = document.querySelector(".lessons-grid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const progressStats = document.querySelector(".progress-stats");

  // Initialize the page
  function init() {
    showLoading();
    fetchLessons();
    setupEventListeners();
  }

  // Make lesson loader global for app.js
  window.loadLessons = init;
  window.fetchLessons = fetchLessons;

  // Show loading state
  function showLoading() {
    if (!lessonsGrid) return;
    
    // Create loading skeleton cards
    const loadingHtml = Array(6).fill().map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    `).join('');

    lessonsGrid.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading lessons...</p>
      </div>
      ${loadingHtml}
    `;
  }

  // Show error message
  function showError(message) {
    if (!lessonsGrid) return;
    lessonsGrid.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Try Again
        </button>
      </div>
    `;
  }

  // Display lessons in the grid
  function displayLessons(lessonsToShow) {
    if (!lessonsGrid) return;

    lessonsGrid.innerHTML = "";

    if (lessonsToShow.length === 0) {
      lessonsGrid.innerHTML =
        '<p class="no-lessons">No lessons found. Try a different filter.</p>';
      return;
    }

    lessonsToShow.forEach((lesson) => {
      const lessonCard = createLessonCard(lesson);
      lessonsGrid.appendChild(lessonCard);
    });
  }

  // Create a lesson card element
  function createLessonCard(lesson) {
    const card = document.createElement("div");
    card.className = "lesson-card";
    card.dataset.category = lesson.category;
    card.innerHTML = `
      <div class="lesson-card-inner">
        <div class="lesson-header">
          <div class="lesson-category">
            <i class="${lesson.icon}"></i>
            <span>${lesson.category}</span>
          </div>
          <div class="lesson-meta">
            <span class="duration"><i class="far fa-clock"></i> ${
              lesson.duration
            }</span>
            <span class="difficulty ${lesson.difficulty.toLowerCase()}">${
      lesson.difficulty
    }</span>
          </div>
        </div>
        <div class="lesson-content">
          <h3>${lesson.title}</h3>
          <p class="lesson-summary">${lesson.summary || ""}</p>
          <p class="lesson-description">${lesson.description || ""}</p>
          ${
            lesson.learningObjectives
              ? `
            <div class="learning-objectives">
              <h4>Learning Objectives:</h4>
              <ul>
                ${lesson.learningObjectives
                  .map((obj) => `<li>${obj}</li>`)
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          <div class="progress-container">
            <div class="progress-bar" style="width: ${lesson.progress}%"></div>
            <span class="progress-text">${lesson.progress}% Complete</span>
          </div>
          <button class="btn start-lesson" data-lesson-id="${lesson.id}">
            ${lesson.progress > 0 ? "Continue" : "Start"} Lesson
          </button>
        </div>
      </div>
    `;
    return card;
  }

  // Filter lessons by category
  function filterLessons(category) {
    const filteredLessons =
      category === "all"
        ? lessons
        : lessons.filter((lesson) => lesson.category === category);

    displayLessons(filteredLessons);
  }

  // Update progress statistics
  function updateProgressStats() {
    if (!progressStats) return;

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(
      (lesson) => lesson.progress === 100
    ).length;
    const progressPercentage =
      Math.round((completedLessons / totalLessons) * 100) || 0;

    progressStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${totalLessons}</span>
        <span class="stat-label">Total Lessons</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${completedLessons}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${progressPercentage}%</span>
        <span class="stat-label">Overall Progress</span>
      </div>
    `;
  }

  // Set up event listeners
  function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");
        // Filter lessons
        filterLessons(button.dataset.category);
      });
    });

    // Start lesson button (event delegation)
    document.addEventListener("click", (e) => {
      if (e.target.closest(".start-lesson")) {
        const lessonId = e.target.closest(".start-lesson").dataset.lessonId;
        startLesson(lessonId);
      }
    });
  }

  // Start a lesson
  function startLesson(lessonId) {
    // Save the lesson ID to localStorage
    localStorage.setItem("currentLesson", lessonId);
    // Redirect to the lesson viewer
    window.location.href = `lesson-viewer.html?id=${lessonId}`;
  }

  // Initialize the page
  init();
});
