/**
 * Gamification System for KidLearner
 * Manages points, levels, leaderboards, and game-like features
 */
class GamificationSystem {
  constructor(progressTracker) {
    this.progressTracker = progressTracker;
    this.leaderboard = [];
    this.init();
  }

  init() {
    this.loadLeaderboard();
    this.setupPointSystem();
    this.setupLevelSystem();
  }

  setupPointSystem() {
    // Point multipliers for different activities
    this.pointMultipliers = {
      lesson_completion: 15,
      quiz_perfect: 25,
      quiz_good: 10,
      quiz_average: 5,
      streak_bonus: 5,
      daily_goal: 20,
      achievement_unlock: (achievement) => achievement.points || 10
    };
  }

  setupLevelSystem() {
    // Level system is already in progressTracker
    // This manages level-specific features
  }

  awardPoints(activity, data = {}) {
    const progress = this.progressTracker.getProgress();
    let points = 0;

    switch (activity) {
      case 'lesson_completion':
        points = this.pointMultipliers.lesson_completion;
        if (data.timeBonus) points += Math.floor(data.timeSpent / 10); // Bonus for speed
        break;
      case 'quiz_score':
        if (data.score === 100) points = this.pointMultipliers.quiz_perfect;
        else if (data.score >= 80) points = this.pointMultipliers.quiz_good;
        else if (data.score >= 60) points = this.pointMultipliers.quiz_average;
        break;
      case 'streak_bonus':
        points = this.pointMultipliers.streak_bonus * data.streakLength;
        break;
      case 'daily_goal':
        points = this.pointMultipliers.daily_goal;
        break;
      case 'achievement':
        points = this.pointMultipliers.achievement_unlock(data.achievement);
        break;
    }

    this.progressTracker.addPoints(points, progress);
    this.showPointsNotification(points, activity);
    return points;
  }

  showPointsNotification(points, activity) {
    // Create floating points animation
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.textContent = `+${points} points`;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      z-index: 10001;
      animation: pointsFloat 2s ease-out forwards;
      pointer-events: none;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  getCurrentLevel() {
    const progress = this.progressTracker.getProgress();
    return this.progressTracker.getCurrentLevel(progress.points);
  }

  getNextLevel() {
    const currentLevel = this.getCurrentLevel();
    return this.progressTracker.levels.find(l => l.level === currentLevel.level + 1);
  }

  getLevelProgress() {
    const progress = this.progressTracker.getProgress();
    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.getNextLevel();

    if (!nextLevel) return { current: 100, needed: 0, remaining: 0 };

    const currentPoints = progress.points - currentLevel.pointsRequired;
    const neededPoints = nextLevel.pointsRequired - currentLevel.pointsRequired;
    const remainingPoints = nextLevel.pointsRequired - progress.points;

    return {
      current: Math.floor((currentPoints / neededPoints) * 100),
      needed: neededPoints,
      remaining: remainingPoints
    };
  }

  // Leaderboard functionality
  loadLeaderboard() {
    // In a real app, this would load from a server
    // For now, we'll simulate with local data
    const stored = localStorage.getItem('kidlearner_leaderboard');
    this.leaderboard = stored ? JSON.parse(stored) : this.generateMockLeaderboard();
  }

  saveLeaderboard() {
    localStorage.setItem('kidlearner_leaderboard', JSON.stringify(this.leaderboard));
  }

  updateLeaderboardEntry(name, score, avatar = null) {
    const existingEntry = this.leaderboard.find(entry => entry.name === name);

    if (existingEntry) {
      if (score > existingEntry.score) {
        existingEntry.score = score;
        existingEntry.lastUpdated = new Date().toISOString();
      }
    } else {
      this.leaderboard.push({
        name,
        score,
        avatar: avatar || this.generateRandomAvatar(),
        lastUpdated: new Date().toISOString()
      });
    }

    // Sort and keep top 10
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10);
    this.saveLeaderboard();
  }

  generateMockLeaderboard() {
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
    return names.map(name => ({
      name,
      score: Math.floor(Math.random() * 1000) + 100,
      avatar: this.generateRandomAvatar(),
      lastUpdated: new Date().toISOString()
    })).sort((a, b) => b.score - a.score);
  }

  generateRandomAvatar() {
    const emojis = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  getLeaderboard(position = null) {
    if (position !== null) {
      return this.leaderboard.slice(0, position);
    }
    return this.leaderboard;
  }

  getUserRank(name) {
    const index = this.leaderboard.findIndex(entry => entry.name === name);
    return index >= 0 ? index + 1 : null;
  }

  // Daily challenges and goals
  generateDailyChallenge() {
    const challenges = [
      { type: 'lessons', target: 2, reward: 25, description: 'Complete 2 lessons today' },
      { type: 'quizzes', target: 3, reward: 30, description: 'Score 80%+ on 3 quizzes' },
      { type: 'streak', target: 5, reward: 40, description: 'Maintain a 5-day streak' },
      { type: 'time', target: 60, reward: 35, description: 'Study for 60 minutes' }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  checkDailyChallenge(challenge) {
    const progress = this.progressTracker.getProgress();
    let completed = false;

    switch (challenge.type) {
      case 'lessons':
        completed = progress.dailyGoals.lessons >= challenge.target;
        break;
      case 'quizzes':
        const todayQuizzes = progress.quizScores.filter(q =>
          new Date(q.date).toDateString() === new Date().toDateString() && q.score >= 80
        );
        completed = todayQuizzes.length >= challenge.target;
        break;
      case 'streak':
        completed = progress.currentStreak >= challenge.target;
        break;
      case 'time':
        completed = progress.timeSpent >= challenge.target;
        break;
    }

    if (completed && !challenge.claimed) {
      this.awardPoints('daily_goal');
      challenge.claimed = true;
      this.showChallengeCompleteNotification(challenge);
    }

    return completed;
  }

  showChallengeCompleteNotification(challenge) {
    setTimeout(() => {
      alert(`🎯 Daily Challenge Complete!\n\n${challenge.description}\n\n+${challenge.reward} points awarded!`);
    }, 1000);
  }

  // Streak rewards
  getStreakReward(streakLength) {
    const rewards = {
      3: { points: 10, message: 'Great start! Keep it up!' },
      7: { points: 25, message: 'Week warrior! You\'re on fire!' },
      14: { points: 50, message: 'Two weeks strong! Amazing dedication!' },
      30: { points: 100, message: 'Monthly champion! You\'re unstoppable!' },
      50: { points: 200, message: 'Golden streak! Legendary learner!' }
    };

    return rewards[streakLength] || null;
  }

  checkStreakRewards() {
    const progress = this.progressTracker.getProgress();
    const reward = this.getStreakReward(progress.currentStreak);

    if (reward && !progress.streakRewards?.includes(progress.currentStreak)) {
      this.awardPoints('streak_bonus', { streakLength: progress.currentStreak });
      this.showStreakRewardNotification(reward);

      if (!progress.streakRewards) progress.streakRewards = [];
      progress.streakRewards.push(progress.currentStreak);
      this.progressTracker.saveProgress(progress);
    }
  }

  showStreakRewardNotification(reward) {
    setTimeout(() => {
      alert(`🔥 Streak Reward!\n\n${reward.message}\n\n+${reward.points} bonus points!`);
    }, 1500);
  }

  // Gamification UI helpers
  createProgressBar(current, max, className = '') {
    const percentage = Math.min((current / max) * 100, 100);
    return `
      <div class="progress-container ${className}">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <span class="progress-text">${current}/${max}</span>
      </div>
    `;
  }

  createLevelIndicator() {
    const level = this.getCurrentLevel();
    const progress = this.getLevelProgress();

    return `
      <div class="level-indicator">
        <div class="level-badge">${level.badge}</div>
        <div class="level-info">
          <div class="level-name">Level ${level.level}: ${level.name}</div>
          <div class="level-progress">${this.createProgressBar(progress.current, 100, 'level-progress-bar')}</div>
          ${progress.remaining > 0 ? `<div class="points-needed">${progress.remaining} points to next level</div>` : '<div class="max-level">Max level reached!</div>'}
        </div>
      </div>
    `;
  }

  createLeaderboardWidget(limit = 5) {
    const leaderboard = this.getLeaderboard(limit);

    return `
      <div class="leaderboard-widget">
        <h3>🏆 Leaderboard</h3>
        <div class="leaderboard-entries">
          ${leaderboard.map((entry, index) => `
            <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
              <span class="rank">#${index + 1}</span>
              <span class="avatar">${entry.avatar}</span>
              <span class="name">${entry.name}</span>
              <span class="score">${entry.score}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Initialize gamification system when progress tracker is ready
let gamificationSystem;
document.addEventListener('DOMContentLoaded', () => {
  if (window.progressTracker) {
    gamificationSystem = new GamificationSystem(window.progressTracker);
  }
});