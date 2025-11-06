/**
 * Progress Tracking System for KidLearner
 * Tracks user learning progress, achievements, and statistics
 */
class ProgressTracker {
  constructor() {
    this.storageKey = 'kidlearner_progress';
    this.achievements = {
      first_lesson: { name: 'First Steps', description: 'Completed your first lesson', icon: '🎯', points: 10 },
      code_master: { name: 'Code Master', description: 'Completed 5 lessons', icon: '👑', points: 50 },
      ai_helper: { name: 'AI Assistant', description: 'Asked AI for help 10 times', icon: '🤖', points: 25 },
      validator: { name: 'Code Explainer', description: 'Explained code 20 times', icon: '✅', points: 30 },
      streak_7: { name: 'Week Warrior', description: '7-day learning streak', icon: '🔥', points: 40 },
      editor_pro: { name: 'Editor Pro', description: 'Saved 10 code files', icon: '💾', points: 20 },
      quiz_champion: { name: 'Quiz Champion', description: 'Scored 100% on 3 quizzes', icon: '🏆', points: 60 },
      speed_demon: { name: 'Speed Demon', description: 'Completed a lesson in under 5 minutes', icon: '⚡', points: 35 },
      perfectionist: { name: 'Perfectionist', description: 'Perfect score on 5 consecutive quizzes', icon: '💎', points: 75 },
      explorer: { name: 'Explorer', description: 'Tried all 3 programming languages', icon: '🗺️', points: 45 }
    };
    this.levels = [
      { level: 1, name: 'Beginner', pointsRequired: 0, badge: '🌱' },
      { level: 2, name: 'Novice', pointsRequired: 50, badge: '🌿' },
      { level: 3, name: 'Apprentice', pointsRequired: 150, badge: '🌳' },
      { level: 4, name: 'Coder', pointsRequired: 300, badge: '💻' },
      { level: 5, name: 'Developer', pointsRequired: 500, badge: '👨‍💻' },
      { level: 6, name: 'Expert', pointsRequired: 750, badge: '🧙‍♂️' },
      { level: 7, name: 'Master', pointsRequired: 1000, badge: '🏆' },
      { level: 8, name: 'Grandmaster', pointsRequired: 1250, badge: '👑' },
      { level: 9, name: 'Legend', pointsRequired: 1500, badge: '⭐' },
      { level: 10, name: 'Mythical', pointsRequired: 2000, badge: '🦄' }
    ];
    this.init();
  }

  init() {
    if (!this.getProgress()) {
      this.resetProgress();
    }
  }

  getProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey)) || null;
      if (data) {
        // Migrate old fields to new ones for backward compatibility
        if (data.codeExplanations == null && typeof data.codeValidations === 'number') {
          data.codeExplanations = data.codeValidations;
        }
      }
      return data;
    } catch (e) {
      console.error('Error loading progress:', e);
      return null;
    }
  }

  saveProgress(progress) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  resetProgress() {
    const initialProgress = {
      lessonsCompleted: [],
      totalLessons: 0,
      aiInteractions: 0,
      codeExplanations: 0,
      codeValidations: 0,
      filesSaved: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      timeSpent: 0, // in minutes
      startDate: new Date().toISOString(),
      // Enhanced progress tracking
      quizScores: [], // Array of {lessonId, score, date, timeSpent}
      totalQuizScore: 0,
      averageQuizScore: 0,
      points: 0,
      level: 1,
      experiencePoints: 0,
      dailyGoals: {
        lessons: 0,
        quizzes: 0,
        timeSpent: 0
      },
      weeklyGoals: {
        lessons: 7,
        quizzes: 5,
        timeSpent: 210 // 3.5 hours
      },
      learningPath: 'beginner',
      preferredDifficulty: 'beginner',
      subjectProgress: {
        html: { completed: 0, total: 0, averageScore: 0 },
        css: { completed: 0, total: 0, averageScore: 0 },
        javascript: { completed: 0, total: 0, averageScore: 0 }
      },
      studyReminders: [],
      lastReminderDate: null
    };
    this.saveProgress(initialProgress);
  }

  completeLesson(lessonId, timeSpent = 0, subject = null) {
    const progress = this.getProgress();
    if (!progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
      progress.totalLessons = progress.lessonsCompleted.length;
      progress.timeSpent += timeSpent;

      // Update subject progress
      if (subject && progress.subjectProgress[subject]) {
        progress.subjectProgress[subject].completed++;
      }

      // Award points for lesson completion
      const lessonPoints = 15;
      this.addPoints(lessonPoints, progress);

      // Check for speed achievement
      if (timeSpent > 0 && timeSpent < 5) {
        this.unlockAchievement('speed_demon', progress);
      }

      this.updateStreak();
      this.checkAchievements(progress);
      this.updateLearningPath(progress);
      this.saveProgress(progress);
    }
  }

  incrementAIInteractions() {
    const progress = this.getProgress();
    progress.aiInteractions++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  incrementValidations() {
    // Backward-compatible alias; prefer incrementExplanations()
    this.incrementExplanations();
  }

  incrementFilesSaved() {
    const progress = this.getProgress();
    progress.filesSaved++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  updateStreak() {
    const progress = this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    const lastActive = progress.lastActiveDate;

    if (lastActive === today) {
      // Already active today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // Consecutive day
      progress.currentStreak++;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    } else {
      // Streak broken
      progress.currentStreak = 1;
    }

    progress.lastActiveDate = today;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  checkAchievements(progress) {
    const newAchievements = [];

    // First lesson achievement
    if (progress.totalLessons >= 1 && !progress.achievements.includes('first_lesson')) {
      newAchievements.push('first_lesson');
    }

    // Code master achievement
    if (progress.totalLessons >= 5 && !progress.achievements.includes('code_master')) {
      newAchievements.push('code_master');
    }

    // AI helper achievement
    if (progress.aiInteractions >= 10 && !progress.achievements.includes('ai_helper')) {
      newAchievements.push('ai_helper');
    }

    // Explainer achievement (was 'validator')
    const explanations = (typeof progress.codeExplanations === 'number') ? progress.codeExplanations : (progress.codeValidations || 0);
    if (explanations >= 20 && !progress.achievements.includes('validator')) {
      newAchievements.push('validator');
    }

    // Streak achievement
    if (progress.currentStreak >= 7 && !progress.achievements.includes('streak_7')) {
      newAchievements.push('streak_7');
    }

    // Editor pro achievement
    if (progress.filesSaved >= 10 && !progress.achievements.includes('editor_pro')) {
      newAchievements.push('editor_pro');
    }

    // Quiz champion achievement
    const perfectQuizzes = progress.quizScores.filter(q => q.score === 100).length;
    if (perfectQuizzes >= 3 && !progress.achievements.includes('quiz_champion')) {
      newAchievements.push('quiz_champion');
    }

    // Perfectionist achievement
    const recentQuizzes = progress.quizScores.slice(-5);
    const allPerfect = recentQuizzes.length >= 5 && recentQuizzes.every(q => q.score === 100);
    if (allPerfect && !progress.achievements.includes('perfectionist')) {
      newAchievements.push('perfectionist');
    }

    // Explorer achievement
    const subjectsCompleted = Object.values(progress.subjectProgress).filter(s => s.completed > 0).length;
    if (subjectsCompleted >= 3 && !progress.achievements.includes('explorer')) {
      newAchievements.push('explorer');
    }

    if (newAchievements.length > 0) {
      progress.achievements.push(...newAchievements);
      this.showAchievementNotification(newAchievements);
      // Award achievement points
      newAchievements.forEach(achievementId => {
        if (this.achievements[achievementId]) {
          this.addPoints(this.achievements[achievementId].points, progress);
        }
      });
      this.saveProgress(progress);
    }
  }

  showAchievementNotification(achievementIds) {
    achievementIds.forEach(id => {
      const achievement = this.achievements[id];
      if (achievement) {
        // Simple notification (could be enhanced with a proper toast system)
        setTimeout(() => {
          alert(`🏆 Achievement Unlocked!\n\n${achievement.icon} ${achievement.name}\n${achievement.description}`);
        }, 1000);
      }
    });
  }

  getStats() {
    const progress = this.getProgress();
    const currentLevel = this.getCurrentLevel(progress.points);
    const nextLevel = this.levels.find(l => l.level === currentLevel.level + 1);

    return {
      lessonsCompleted: progress.totalLessons,
      aiInteractions: progress.aiInteractions,
      codeExplanations: (typeof progress.codeExplanations === 'number') ? progress.codeExplanations : (progress.codeValidations || 0),
      filesSaved: progress.filesSaved,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      achievementsCount: progress.achievements.length,
      totalAchievements: Object.keys(this.achievements).length,
      achievements: progress.achievements.map(id => this.achievements[id]),
      // Enhanced stats
      totalQuizScore: progress.totalQuizScore,
      averageQuizScore: progress.averageQuizScore,
      points: progress.points,
      level: currentLevel,
      nextLevel: nextLevel,
      experiencePoints: progress.experiencePoints,
      timeSpent: progress.timeSpent,
      learningPath: progress.learningPath,
      preferredDifficulty: progress.preferredDifficulty,
      subjectProgress: progress.subjectProgress,
      dailyGoals: progress.dailyGoals,
      weeklyGoals: progress.weeklyGoals,
      completionRate: progress.totalLessons > 0 ? (progress.quizScores.filter(q => q.score >= 70).length / progress.quizScores.length * 100) : 0
    };
  }

  incrementExplanations() {
    const progress = this.getProgress();
    if (typeof progress.codeExplanations !== 'number') {
      progress.codeExplanations = progress.codeValidations || 0;
    }
    progress.codeExplanations++;
    this.checkAchievements(progress);
    this.saveProgress(progress);
  }

  addTimeSpent(minutes) {
    const progress = this.getProgress();
    progress.timeSpent += minutes;
    this.saveProgress(progress);
  }

  isLessonCompleted(lessonId) {
    const progress = this.getProgress();
    return progress.lessonsCompleted.includes(lessonId);
  }

  exportProgress() {
    return this.getProgress();
  }

  importProgress(progressData) {
    try {
      this.saveProgress(progressData);
      return true;
    } catch (e) {
      console.error('Error importing progress:', e);
      return false;
    }
  }

  // Enhanced methods for quiz tracking and gamification
  recordQuizScore(lessonId, score, timeSpent = 0, subject = null) {
    const progress = this.getProgress();
    const quizEntry = {
      lessonId,
      score,
      date: new Date().toISOString(),
      timeSpent
    };

    progress.quizScores.push(quizEntry);
    progress.totalQuizScore += score;

    // Update average score
    progress.averageQuizScore = progress.totalQuizScore / progress.quizScores.length;

    // Update subject progress
    if (subject && progress.subjectProgress[subject]) {
      const subjectData = progress.subjectProgress[subject];
      subjectData.total++;
      subjectData.averageScore = (subjectData.averageScore * (subjectData.total - 1) + score) / subjectData.total;
    }

    // Award points based on score
    let quizPoints = Math.floor(score / 10); // 10 points per 10% score
    if (score === 100) quizPoints += 10; // Bonus for perfect score
    this.addPoints(quizPoints, progress);

    // Update daily goals
    progress.dailyGoals.quizzes++;

    this.checkAchievements(progress);
    this.updateLearningPath(progress);
    this.saveProgress(progress);
  }

  addPoints(points, progress = null) {
    if (!progress) progress = this.getProgress();
    progress.points += points;
    progress.experiencePoints += points;

    // Check for level up
    const newLevel = this.calculateLevel(progress.points);
    if (newLevel > progress.level) {
      progress.level = newLevel;
      this.showLevelUpNotification(newLevel);
    }
  }

  calculateLevel(points) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].pointsRequired) {
        return this.levels[i].level;
      }
    }
    return 1;
  }

  getCurrentLevel(points) {
    return this.levels.find(level => level.level === this.calculateLevel(points)) || this.levels[0];
  }

  showLevelUpNotification(level) {
    const levelData = this.levels.find(l => l.level === level);
    if (levelData) {
      setTimeout(() => {
        alert(`🎉 Level Up! ${levelData.badge} ${levelData.name}\n\nYou've reached level ${level}!`);
      }, 500);
    }
  }

  updateLearningPath(progress) {
    const avgScore = progress.averageQuizScore;
    const lessonsCompleted = progress.totalLessons;

    if (lessonsCompleted >= 20 && avgScore >= 85) {
      progress.learningPath = 'advanced';
      progress.preferredDifficulty = 'advanced';
    } else if (lessonsCompleted >= 10 && avgScore >= 70) {
      progress.learningPath = 'intermediate';
      progress.preferredDifficulty = 'intermediate';
    } else {
      progress.learningPath = 'beginner';
      progress.preferredDifficulty = 'beginner';
    }
  }

  getRecommendedLessons(availableLessons = []) {
    const progress = this.getProgress();
    const completedIds = new Set(progress.lessonsCompleted);

    // Filter out completed lessons
    const uncompletedLessons = availableLessons.filter(lesson => !completedIds.has(lesson.id));

    // Sort by difficulty preference and subject balance
    return uncompletedLessons.sort((a, b) => {
      // Prioritize preferred difficulty
      const aMatchesDifficulty = a.difficulty === progress.preferredDifficulty ? 1 : 0;
      const bMatchesDifficulty = b.difficulty === progress.preferredDifficulty ? 1 : 0;

      if (aMatchesDifficulty !== bMatchesDifficulty) {
        return bMatchesDifficulty - aMatchesDifficulty;
      }

      // Balance subjects
      const aSubjectProgress = progress.subjectProgress[a.subject.toLowerCase()] || { completed: 0 };
      const bSubjectProgress = progress.subjectProgress[b.subject.toLowerCase()] || { completed: 0 };

      return aSubjectProgress.completed - bSubjectProgress.completed;
    });
  }

  getProgressAnalytics() {
    const progress = this.getProgress();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyQuizzes = progress.quizScores.filter(q => new Date(q.date) >= weekAgo);
    const weeklyLessons = progress.lessonsCompleted.filter(date => new Date(date) >= weekAgo);

    return {
      weeklyActivity: {
        quizzes: weeklyQuizzes.length,
        lessons: weeklyLessons.length,
        averageScore: weeklyQuizzes.length > 0 ? weeklyQuizzes.reduce((sum, q) => sum + q.score, 0) / weeklyQuizzes.length : 0
      },
      improvement: this.calculateImprovement(progress),
      strengths: this.identifyStrengths(progress),
      recommendations: this.generateRecommendations(progress)
    };
  }

  calculateImprovement(progress) {
    if (progress.quizScores.length < 5) return 0;

    const recent = progress.quizScores.slice(-5);
    const earlier = progress.quizScores.slice(-10, -5);

    const recentAvg = recent.reduce((sum, q) => sum + q.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, q) => sum + q.score, 0) / earlier.length;

    return recentAvg - earlierAvg;
  }

  identifyStrengths(progress) {
    const strengths = [];
    const subjects = Object.entries(progress.subjectProgress);

    subjects.forEach(([subject, data]) => {
      if (data.averageScore >= 85) {
        strengths.push({ subject, level: 'excellent' });
      } else if (data.averageScore >= 70) {
        strengths.push({ subject, level: 'good' });
      }
    });

    return strengths;
  }

  generateRecommendations(progress) {
    const recommendations = [];

    if (progress.currentStreak < 3) {
      recommendations.push('Try to maintain a daily learning streak!');
    }

    if (progress.averageQuizScore < 70) {
      recommendations.push('Focus on understanding core concepts before moving to advanced topics.');
    }

    const weakSubjects = Object.entries(progress.subjectProgress)
      .filter(([_, data]) => data.averageScore < 70 && data.total > 0);

    if (weakSubjects.length > 0) {
      recommendations.push(`Spend more time practicing ${weakSubjects.map(([s]) => s).join(' and ')}.`);
    }

    return recommendations;
  }


  unlockAchievement(achievementId, progress = null) {
    if (!progress) progress = this.getProgress();
    if (!progress.achievements.includes(achievementId)) {
      progress.achievements.push(achievementId);
      this.showAchievementNotification([achievementId]);
      if (this.achievements[achievementId]) {
        this.addPoints(this.achievements[achievementId].points, progress);
      }
      this.saveProgress(progress);
    }
  }
}

// Initialize global progress tracker
const progressTracker = new ProgressTracker();
window.progressTracker = progressTracker;

// Add checkDailyGoals method if it doesn't exist
if (!progressTracker.checkDailyGoals) {
  progressTracker.checkDailyGoals = function() {
    // Daily goals checking logic
    const progress = this.getProgress();
    const today = new Date().toISOString().split('T')[0];

    // Reset daily goals if it's a new day
    if (progress.lastActiveDate !== today) {
      progress.dailyGoals = {
        lessons: 0,
        quizzes: 0,
        timeSpent: 0
      };
      this.saveProgress(progress);
    }

    // Check if daily goals are met
    const goalsMet = {
      lessons: progress.dailyGoals.lessons >= 1,
      quizzes: progress.dailyGoals.quizzes >= 1,
      timeSpent: progress.dailyGoals.timeSpent >= 30 // 30 minutes
    };

    // Show reminder if goals not met
    if (!goalsMet.lessons || !goalsMet.quizzes || !goalsMet.timeSpent) {
      console.log('Daily goals reminder: Keep learning!');
      // Could show a notification here
    }

    return goalsMet;
  };
}