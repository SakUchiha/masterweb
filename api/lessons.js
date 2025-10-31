const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to read lessons from the built dist directory
    const lessonsPath = path.join(process.cwd(), 'code-understanding-app', 'dist', 'data', 'lessons.json');

    if (!fs.existsSync(lessonsPath)) {
      // Fallback to source directory
      const fallbackPath = path.join(process.cwd(), 'code-understanding-app', 'backend', 'server.js', 'data', 'lessons.json');
      if (!fs.existsSync(fallbackPath)) {
        return res.status(404).json({ error: 'Lessons data not found' });
      }
      const lessonsData = fs.readFileSync(fallbackPath, 'utf8');
      const lessons = JSON.parse(lessonsData);
      return res.status(200).json(lessons);
    }

    const lessonsData = fs.readFileSync(lessonsPath, 'utf8');
    const lessons = JSON.parse(lessonsData);
    res.status(200).json(lessons);
  } catch (error) {
    console.error('Error loading lessons:', error);
    res.status(500).json({ error: 'Failed to load lessons' });
  }
}