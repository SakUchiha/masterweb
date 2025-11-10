document.addEventListener("DOMContentLoaded", function() {
  let lessons = [];
  let filteredLessons = [];

  // DOM elements
  const lessonsGrid = document.querySelector(".lessons-grid");
  const progressStats = document.querySelector(".progress-stats");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Initialize the app
  async function init() {
    showLoadingState();
    await loadLessons();
    setupEventListeners();
  }

  // Load lessons from API
  async function loadLessons() {
    try {
      console.log('Fetching lessons from:', `${CONFIG.API_BASE_URL}/api/lessons`);

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/lessons`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lessons loaded:', data.length);

      // Process lessons data
      lessons = data.map(lesson => ({
        ...lesson,
        progress: lesson.progress || 0,
        level: lesson.difficulty,
        icon: lesson.category === 'HTML' ? 'fab fa-html5' :
              lesson.category === 'CSS' ? 'fab fa-css3-alt' :
              'fab fa-js'
      }));

      filteredLessons = [...lessons];
      renderLessons(filteredLessons);
      updateProgressStats();

    } catch (error) {
      console.error('Error loading lessons:', error);
      showErrorState(`Failed to load lessons: ${error.message}`);
    }
  }

  // Render lessons to the grid
  function renderLessons(lessonsToRender) {
    if (!lessonsGrid) return;

    lessonsGrid.innerHTML = '';

    if (lessonsToRender.length === 0) {
      lessonsGrid.innerHTML = '<p class="no-lessons">No lessons found. Try a different filter.</p>';
      return;
    }

    lessonsToRender.forEach(lesson => {
      const lessonCard = createLessonCard(lesson);
      lessonsGrid.appendChild(lessonCard);
    });
  }

  // Create a lesson card element
  function createLessonCard(lesson) {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.dataset.category = lesson.category;

    card.innerHTML = `
      <div class="lesson-card-inner">
        <div class="lesson-header">
          <div class="lesson-category">
            <i class="${lesson.icon}"></i>
            <span>${lesson.category}</span>
          </div>
          <div class="lesson-meta">
            <span class="duration"><i class="far fa-clock"></i> ${lesson.duration}</span>
            <span class="difficulty ${lesson.difficulty.toLowerCase()}">${lesson.difficulty}</span>
          </div>
        </div>
        <div class="lesson-content">
          <h3>${lesson.title}</h3>
          <p class="lesson-summary">${lesson.summary || ''}</p>
          <p class="lesson-description">${lesson.description || ''}</p>
          ${lesson.learningObjectives ? `
            <div class="learning-objectives">
              <h4>Learning Objectives:</h4>
              <ul>
                ${lesson.learningObjectives.map(obj => `<li>${obj}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="progress-container">
            <div class="progress-bar">
              <div style="width: ${lesson.progress}%"></div>
            </div>
            <span class="progress-text">${lesson.progress}% Complete</span>
          </div>
          <button class="btn btn-primary start-lesson" data-lesson-id="${lesson.id}">
            ${lesson.progress > 0 ? 'Continue' : 'Start'} Lesson
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // Update progress statistics
  function updateProgressStats() {
    if (!progressStats) return;

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.progress === 100).length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

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

  // Show loading state
  function showLoadingState() {
    if (!lessonsGrid) return;

    lessonsGrid.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading lessons...</p>
      </div>
      ${Array(6).fill().map(() => `
        <div class="skeleton-card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `).join('')}
    `;
  }

  // Show error state
  function showErrorState(message) {
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

  // Setup event listeners
  function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.dataset.category;

        if (category === 'all') {
          filteredLessons = [...lessons];
        } else {
          filteredLessons = lessons.filter(lesson => lesson.category === category);
        }

        renderLessons(filteredLessons);
      });
    });

    // Lesson start buttons (delegated)
    document.addEventListener('click', (event) => {
      const startButton = event.target.closest('.start-lesson');
      if (startButton) {
        const lessonId = startButton.dataset.lessonId;
        if (lessonId) {
          localStorage.setItem('currentLesson', lessonId);
          window.location.href = `lesson-viewer.html?id=${lessonId}`;
        }
      }
    });
  }

  // Public API for external access
  window.loadLessons = init;
  window.fetchLessons = loadLessons;

  // Start the app
  init();
});