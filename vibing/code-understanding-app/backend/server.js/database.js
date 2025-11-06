const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'kidlearner.db');
    this.db = null;
  }

  // Initialize database connection
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve(this.db);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Database close error:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Execute a query with parameters
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database run error:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database all error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Execute multiple statements in a transaction
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Database exec error:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Begin transaction
  beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  // Commit transaction
  commit() {
    return this.run('COMMIT');
  }

  // Rollback transaction
  rollback() {
    return this.run('ROLLBACK');
  }
}

// Singleton instance
const database = new Database();

module.exports = database;