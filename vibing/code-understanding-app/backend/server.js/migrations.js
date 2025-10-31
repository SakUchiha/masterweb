const fs = require('fs');
const path = require('path');
const models = require('./models');

// Migration system for safely transferring data from JSON to database
class Migrations {
  constructor() {
    this.lessonsPath = path.join(__dirname, 'data', 'lessons.json');
    this.migrationLogPath = path.join(__dirname, 'migration_log.json');
  }

  // Check if migration has already been completed
  async isMigrated() {
    try {
      const log = await this.getMigrationLog();
      return log.lessons_migrated === true;
    } catch (error) {
      return false;
    }
  }

  // Get migration log
  async getMigrationLog() {
    try {
      if (fs.existsSync(this.migrationLogPath)) {
        const data = fs.readFileSync(this.migrationLogPath, 'utf8');
        return JSON.parse(data);
      }
      return { lessons_migrated: false, migrated_at: null, lesson_count: 0 };
    } catch (error) {
      console.error('Error reading migration log:', error);
      return { lessons_migrated: false, migrated_at: null, lesson_count: 0 };
    }
  }

  // Update migration log
  async updateMigrationLog(updates) {
    try {
      const currentLog = await this.getMigrationLog();
      const newLog = { ...currentLog, ...updates, migrated_at: new Date().toISOString() };
      fs.writeFileSync(this.migrationLogPath, JSON.stringify(newLog, null, 2));
      console.log('Migration log updated:', newLog);
    } catch (error) {
      console.error('Error updating migration log:', error);
    }
  }

  // Validate lessons data structure
  validateLessonData(lesson) {
    const requiredFields = ['id', 'title', 'category', 'difficulty', 'summary', 'description'];

    for (const field of requiredFields) {
      if (!lesson[field]) {
        throw new Error(`Lesson ${lesson.id || 'unknown'} missing required field: ${field}`);
      }
    }

    // Validate content structure - some lessons use 'slides', others use 'content'
    if (lesson.slides && !Array.isArray(lesson.slides)) {
      throw new Error(`Lesson ${lesson.id} has invalid slides array`);
    }

    if (lesson.learningObjectives && !Array.isArray(lesson.learningObjectives)) {
      throw new Error(`Lesson ${lesson.id} has invalid learningObjectives array`);
    }

    // Allow lessons without slides if they have content field
    if (!lesson.slides && !lesson.content) {
      throw new Error(`Lesson ${lesson.id} missing both slides and content fields`);
    }

    return true;
  }

  // Migrate lessons from JSON to database
  async migrateLessons() {
    try {
      console.log('Starting lessons migration...');

      // Check if already migrated
      if (await this.isMigrated()) {
        console.log('Lessons already migrated, skipping...');
        return { success: true, message: 'Already migrated' };
      }

      // Read lessons JSON file
      if (!fs.existsSync(this.lessonsPath)) {
        throw new Error(`Lessons file not found: ${this.lessonsPath}`);
      }

      const lessonsData = JSON.parse(fs.readFileSync(this.lessonsPath, 'utf8'));

      if (!Array.isArray(lessonsData)) {
        throw new Error('Lessons data is not an array');
      }

      console.log(`Found ${lessonsData.length} lessons to migrate`);

      let migratedCount = 0;
      let errors = [];

      // Begin transaction for data integrity
      await models.database.beginTransaction();

      try {
        for (const lesson of lessonsData) {
          try {
            // Validate lesson data
            this.validateLessonData(lesson);

            // Extract content fields - handle both slides and content structures
            const content = {
              slides: lesson.slides || [],
              learningObjectives: lesson.learningObjectives || [],
              exercise: lesson.exercise,
              content: lesson.content // For lessons that use content instead of slides
            };

            // Create lesson in database
            await models.createLesson({
              id: lesson.id,
              title: lesson.title,
              category: lesson.category,
              difficulty: lesson.difficulty,
              duration: lesson.duration,
              summary: lesson.summary,
              description: lesson.description,
              content: content,
              nextLesson: lesson.nextLesson
            });

            migratedCount++;
            console.log(`Migrated lesson: ${lesson.id}`);

          } catch (lessonError) {
            console.error(`Error migrating lesson ${lesson.id}:`, lessonError.message);
            errors.push({ lessonId: lesson.id, error: lessonError.message });
          }
        }

        // Commit transaction if successful
        await models.database.commit();

        // Update migration log
        await this.updateMigrationLog({
          lessons_migrated: true,
          lesson_count: migratedCount
        });

        console.log(`Lessons migration completed. Migrated: ${migratedCount}, Errors: ${errors.length}`);

        return {
          success: true,
          migrated: migratedCount,
          errors: errors.length,
          errorDetails: errors
        };

      } catch (transactionError) {
        // Rollback on error
        await models.database.rollback();
        throw transactionError;
      }

    } catch (error) {
      console.error('Lessons migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Rollback migration (remove all migrated data)
  async rollbackLessons() {
    try {
      console.log('Starting lessons rollback...');

      // Check if migration exists
      if (!(await this.isMigrated())) {
        console.log('No migration to rollback');
        return { success: true, message: 'No migration to rollback' };
      }

      // Connect to database if not already connected
      await models.database.connect();

      // Begin transaction
      await models.database.beginTransaction();

      try {
        // Delete all lessons
        await models.database.run('DELETE FROM lessons');

        // Reset migration log
        await this.updateMigrationLog({
          lessons_migrated: false,
          lesson_count: 0
        });

        // Commit transaction
        await models.database.commit();

        console.log('Lessons rollback completed successfully');
        return { success: true };

      } catch (rollbackError) {
        await models.database.rollback();
        throw rollbackError;
      }

    } catch (error) {
      console.error('Lessons rollback failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify migration integrity
  async verifyMigration() {
    try {
      console.log('Verifying migration integrity...');

      // Connect to database if not already connected
      await models.database.connect();

      // Check migration log
      const log = await this.getMigrationLog();
      if (!log.lessons_migrated) {
        return { valid: false, reason: 'Migration not completed' };
      }

      // Count database records
      const dbCount = await models.database.get('SELECT COUNT(*) as count FROM lessons');
      const expectedCount = log.lesson_count;

      if (dbCount.count !== expectedCount) {
        return {
          valid: false,
          reason: `Record count mismatch. Expected: ${expectedCount}, Found: ${dbCount.count}`
        };
      }

      // Read original JSON and compare key fields
      const originalData = JSON.parse(fs.readFileSync(this.lessonsPath, 'utf8'));
      const dbLessons = await models.getAllLessons();

      for (const original of originalData) {
        const dbLesson = dbLessons.find(l => l.id === original.id);
        if (!dbLesson) {
          return { valid: false, reason: `Lesson ${original.id} not found in database` };
        }

        // Check key fields
        if (dbLesson.title !== original.title || dbLesson.category !== original.category) {
          return { valid: false, reason: `Lesson ${original.id} data mismatch` };
        }
      }

      console.log('Migration integrity verified successfully');
      return { valid: true, recordCount: dbCount.count };

    } catch (error) {
      console.error('Migration verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  // Run full migration process
  async runFullMigration() {
    try {
      console.log('Starting full migration process...');

      // Initialize database tables
      await models.initializeTables();

      // Migrate lessons
      const migrationResult = await this.migrateLessons();

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }

      // Verify migration
      const verification = await this.verifyMigration();

      if (!verification.valid) {
        throw new Error(`Migration verification failed: ${verification.reason}`);
      }

      console.log('Full migration process completed successfully');
      return {
        success: true,
        migrated: migrationResult.migrated,
        verified: verification.valid,
        recordCount: verification.recordCount
      };

    } catch (error) {
      console.error('Full migration process failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new Migrations();