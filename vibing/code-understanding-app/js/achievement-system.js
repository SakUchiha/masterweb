/**
 * Achievement System for KidLearner
 * Manages advanced badge system, notifications, and achievement tracking
 */
class AchievementSystem {
  constructor(progressTracker) {
    this.progressTracker = progressTracker;
    this.notifications = [];
    this.init();
  }

  init() {
    this.loadAchievementTemplates();
    this.setupNotificationSystem();
  }

  loadAchievementTemplates() {
    // Achievement templates are already in progressTracker
    // This could be extended to load from external config
  }

  setupNotificationSystem() {
    this.notificationContainer = this.createNotificationContainer();
    document.body.appendChild(this.notificationContainer);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'achievement-notifications';
    container.className = 'achievement-notifications';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    return container;
  }

  showAchievementNotification(achievementIds) {
    achievementIds.forEach((id, index) => {
      setTimeout(() => {
        const achievement = this.progressTracker.achievements[id];
        if (achievement) {
          this.createAchievementToast(achievement);
        }
      }, index * 500); // Stagger notifications
    });
  }

  createAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-details">
          <h4>Achievement Unlocked!</h4>
          <h3>${achievement.name}</h3>
          <p>${achievement.description}</p>
          ${achievement.points ? `<div class="achievement-points">+${achievement.points} points</div>` : ''}
        </div>
        <button class="achievement-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    toast.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 10px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      pointer-events: auto;
      cursor: pointer;
      min-width: 350px;
    `;

    // Animate in
    this.notificationContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
      }
    }, 5000);

    // Add click to dismiss
    toast.addEventListener('click', () => {
      toast.style.transform = 'translateX(400px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    });
  }

  getAchievementProgress(achievementId) {
    const progress = this.progressTracker.getProgress();
    const achievement = this.progressTracker.achievements[achievementId];

    if (!achievement) return null;

    let current = 0;
    let target = 0;

    switch (achievementId) {
      case 'first_lesson':
        current = progress.totalLessons;
        target = 1;
        break;
      case 'code_master':
        current = progress.totalLessons;
        target = 5;
        break;
      case 'ai_helper':
        current = progress.aiInteractions;
        target = 10;
        break;
      case 'validator':
        current = (typeof progress.codeExplanations === 'number') ? progress.codeExplanations : (progress.codeValidations || 0);
        target = 20;
        break;
      case 'streak_7':
        current = progress.currentStreak;
        target = 7;
        break;
      case 'editor_pro':
        current = progress.filesSaved;
        target = 10;
        break;
      case 'quiz_champion':
        current = progress.quizScores.filter(q => q.score === 100).length;
        target = 3;
        break;
      case 'perfectionist':
        const recent = progress.quizScores.slice(-5);
        current = recent.filter(q => q.score === 100).length;
        target = 5;
        break;
      case 'explorer':
        current = Object.values(progress.subjectProgress).filter(s => s.completed > 0).length;
        target = 3;
        break;
    }

    return {
      current,
      target,
      percentage: Math.min((current / target) * 100, 100),
      completed: progress.achievements.includes(achievementId)
    };
  }

  getAllAchievementProgress() {
    return Object.keys(this.progressTracker.achievements).map(id => ({
      id,
      ...this.progressTracker.achievements[id],
      ...this.getAchievementProgress(id)
    }));
  }

  getRecentAchievements(days = 7) {
    const progress = this.progressTracker.getProgress();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return progress.achievements
      .map(id => this.progressTracker.achievements[id])
      .filter(achievement => {
        // This would need to be enhanced with achievement unlock dates
        return true; // For now, return all
      });
  }

  createAchievementGallery() {
    const achievements = this.getAllAchievementProgress();
    const gallery = document.createElement('div');
    gallery.className = 'achievement-gallery';

    achievements.forEach(achievement => {
      const card = this.createAchievementCard(achievement);
      gallery.appendChild(card);
    });

    return gallery;
  }

  createAchievementCard(achievement) {
    const card = document.createElement('div');
    card.className = `achievement-card ${achievement.completed ? 'unlocked' : 'locked'}`;

    card.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <h4>${achievement.name}</h4>
        <p>${achievement.description}</p>
        ${achievement.points ? `<div class="achievement-points">${achievement.points} pts</div>` : ''}
      </div>
      ${!achievement.completed ? `
        <div class="achievement-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${achievement.percentage}%"></div>
          </div>
          <span class="progress-text">${achievement.current}/${achievement.target}</span>
        </div>
      ` : '<div class="achievement-unlocked">✓</div>'}
    `;

    return card;
  }
}

// Initialize achievement system when progress tracker is ready
let achievementSystem;
document.addEventListener('DOMContentLoaded', () => {
  if (window.progressTracker) {
    achievementSystem = new AchievementSystem(window.progressTracker);
  }
});