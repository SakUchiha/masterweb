const database = require('./database');

// Database schema definitions and model operations
class Models {
  constructor() {
    this.database = database;
  }

  // Initialize all tables
  async initializeTables() {
    try {
      await this.database.connect();

      // Users table (for future authentication)
      await this.database.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Lessons table (migrated from lessons.json)
      await this.database.exec(`
        CREATE TABLE IF NOT EXISTS lessons (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          duration TEXT,
          summary TEXT,
          description TEXT,
          content TEXT, -- JSON string for slides, learningObjectives, exercise
          next_lesson TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Progress table (for user progress tracking)
      await this.database.exec(`
        CREATE TABLE IF NOT EXISTS progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          lesson_id TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          score INTEGER DEFAULT 0,
          time_spent INTEGER DEFAULT 0, -- in seconds
          attempts INTEGER DEFAULT 0,
          last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (lesson_id) REFERENCES lessons (id),
          UNIQUE(user_id, lesson_id)
        )
      `);

      // Achievements table (for gamification data)
      await this.database.exec(`
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          achievement_type TEXT NOT NULL,
          achievement_name TEXT NOT NULL,
          description TEXT,
          points INTEGER DEFAULT 0,
          unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, achievement_type)
        )
      `);

      // Sessions table (for learning analytics)
      await this.database.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          session_type TEXT NOT NULL, -- 'lesson', 'quiz', 'practice'
          lesson_id TEXT,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          duration INTEGER, -- in seconds
          actions TEXT, -- JSON string of user actions
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        )
      `);

      console.log('All database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing tables:', error);
      throw error;
    }
  }

  // User operations
  async createUser(userData) {
    const { username, email, password_hash } = userData;
    const sql = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    return await this.database.run(sql, [username, email, password_hash]);
  }

  async getUserById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return await this.database.get(sql, [id]);
  }

  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return await this.database.get(sql, [username]);
  }

  // Lesson operations
  async createLesson(lessonData) {
    const { id, title, category, difficulty, duration, summary, description, content, nextLesson } = lessonData;
    const sql = `
      INSERT INTO lessons (id, title, category, difficulty, duration, summary, description, content, next_lesson)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await this.database.run(sql, [id, title, category, difficulty, duration, summary, description, JSON.stringify(content), nextLesson]);
  }

  async getAllLessons() {
    const sql = 'SELECT * FROM lessons ORDER BY created_at DESC';
    const lessons = await this.database.all(sql);

    // Parse JSON content back to objects and ensure backward compatibility
    return lessons.map(lesson => {
      const content = JSON.parse(lesson.content || '{}');
      return {
        id: lesson.id,
        title: lesson.title,
        category: lesson.category,
        difficulty: lesson.difficulty,
        duration: lesson.duration,
        summary: lesson.summary,
        description: lesson.description,
        slides: content.slides || [],
        learningObjectives: content.learningObjectives || [],
        exercise: content.exercise,
        nextLesson: lesson.next_lesson,
        content: content.content // For lessons that use content field
      };
    });
  }

  async getLessonById(id) {
    const sql = 'SELECT * FROM lessons WHERE id = ?';
    const lesson = await this.database.get(sql, [id]);

    if (lesson) {
      const content = JSON.parse(lesson.content || '{}');
      return {
        id: lesson.id,
        title: lesson.title,
        category: lesson.category,
        difficulty: lesson.difficulty,
        duration: lesson.duration,
        summary: lesson.summary,
        description: lesson.description,
        slides: content.slides || [],
        learningObjectives: content.learningObjectives || [],
        exercise: content.exercise,
        nextLesson: lesson.next_lesson,
        content: content.content // For lessons that use content field
      };
    }

    return lesson;
  }

  // Progress operations
  async updateProgress(progressData) {
    const { user_id, lesson_id, completed, score, time_spent, attempts } = progressData;
    const sql = `
      INSERT INTO progress (user_id, lesson_id, completed, score, time_spent, attempts, last_attempt, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        completed = excluded.completed,
        score = excluded.score,
        time_spent = excluded.time_spent,
        attempts = excluded.attempts,
        last_attempt = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;
    return await this.database.run(sql, [user_id, lesson_id, completed, score, time_spent, attempts]);
  }

  async getUserProgress(userId) {
    const sql = 'SELECT * FROM progress WHERE user_id = ?';
    return await this.database.all(sql, [userId]);
  }

  // Achievement operations
  async unlockAchievement(achievementData) {
    const { user_id, achievement_type, achievement_name, description, points } = achievementData;
    const sql = `
      INSERT INTO achievements (user_id, achievement_type, achievement_name, description, points)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await this.database.run(sql, [user_id, achievement_type, achievement_name, description, points]);
  }

  async getUserAchievements(userId) {
    const sql = 'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC';
    return await this.database.all(sql, [userId]);
  }

  // Session operations
  async startSession(sessionData) {
    const { user_id, session_type, lesson_id } = sessionData;
    const sql = `
      INSERT INTO sessions (user_id, session_type, lesson_id, start_time)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    return await this.database.run(sql, [user_id, session_type, lesson_id]);
  }

  async endSession(sessionId, actions = null) {
    const sql = `
      UPDATE sessions
      SET end_time = CURRENT_TIMESTAMP,
          duration = (julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 86400,
          actions = ?
      WHERE id = ?
    `;
    return await this.database.run(sql, [JSON.stringify(actions), sessionId]);
  }

  async getUserSessions(userId, limit = 50) {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ?';
    return await this.database.all(sql, [userId, limit]);
  }

  // Analytics methods
  async getLessonCompletionStats() {
    const sql = `
      SELECT
        l.id,
        l.title,
        l.category,
        COUNT(p.id) as total_attempts,
        SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed_count,
        AVG(p.score) as avg_score,
        AVG(p.time_spent) as avg_time_spent
      FROM lessons l
      LEFT JOIN progress p ON l.id = p.lesson_id
      GROUP BY l.id, l.title, l.category
    `;
    return await this.database.all(sql);
  }

  async getUserStats(userId) {
    const sql = `
      SELECT
        COUNT(DISTINCT p.lesson_id) as lessons_started,
        SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as lessons_completed,
        AVG(p.score) as avg_score,
        SUM(p.time_spent) as total_time_spent,
        COUNT(a.id) as achievements_count,
        SUM(a.points) as total_points
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id
      LEFT JOIN achievements a ON u.id = a.user_id
      WHERE u.id = ?
    `;
    return await this.database.get(sql, [userId]);
  }
}

module.exports = new Models();