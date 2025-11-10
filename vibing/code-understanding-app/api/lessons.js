const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to lessons data - Fixed for Vercel serverless environment
const LESSONS_FILE = process.env.VERCEL
  ? path.join(process.cwd(), 'api', 'data', 'lessons.json')
  : path.join(__dirname, 'data', 'lessons.json');

// GET /api/lessons - Get all lessons
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to read lessons file from:', LESSONS_FILE);

    // Check if file exists first
    try {
      await fs.access(LESSONS_FILE);
    } catch (accessError) {
      console.error('Lessons file not found:', LESSONS_FILE);
      return res.status(500).json({
        error: 'File not found',
        message: 'Lessons data file is missing'
      });
    }

    const data = await fs.readFile(LESSONS_FILE, 'utf8');
    const lessons = JSON.parse(data);

    console.log('Successfully loaded', lessons.length, 'lessons');

    // Add progress tracking (in a real app, this would come from a database)
    const lessonsWithProgress = lessons.map(lesson => ({
      ...lesson,
      progress: 0, // Default progress
      level: lesson.difficulty,
      icon: lesson.category === 'HTML' ? 'fab fa-html5' :
            lesson.category === 'CSS' ? 'fab fa-css3-alt' :
            'fab fa-js'
    }));

    res.json(lessonsWithProgress);
  } catch (error) {
    console.error('Error reading lessons:', error);
    res.status(500).json({
      error: 'Failed to load lessons',
      message: 'Unable to read lessons data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/lessons/:id - Get specific lesson
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(LESSONS_FILE, 'utf8');
    const lessons = JSON.parse(data);

    const lesson = lessons.find(l => l.id === id);
    if (!lesson) {
      return res.status(404).json({
        error: 'Lesson not found',
        message: `No lesson found with id: ${id}`
      });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Error reading lesson:', error);
    res.status(500).json({
      error: 'Failed to load lesson',
      message: 'Unable to read lesson data'
    });
  }
});

// POST /api/lessons/:id/progress - Update lesson progress
router.post('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    // In a real app, this would update a database
    // For now, we'll just acknowledge the request
    res.json({
      success: true,
      lessonId: id,
      progress: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      error: 'Failed to update progress',
      message: 'Unable to save progress data'
    });
  }
});

module.exports = router;