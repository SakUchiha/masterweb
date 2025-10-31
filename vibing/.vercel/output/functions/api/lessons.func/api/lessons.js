const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Try to load lessons from backend file
  try {
    // For Vercel deployment, use the relative path from the project root
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const basePath = isVercel 
      ? path.join(process.cwd(), 'code-understanding-app', 'backend', 'data')
      : path.join(process.cwd(), '..', 'code-understanding-app', 'backend', 'data');
      
    const lessonsPath = path.join(basePath, 'lessons.json');
    console.log('Loading lessons from:', lessonsPath, 'isVercel:', isVercel);
    
    const lessonsRaw = fs.readFileSync(lessonsPath, 'utf-8');
    const lessons = JSON.parse(lessonsRaw);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(lessons);
    return;
  } catch (e) {
    // fallback
    res.status(200).json([
      {
        id: 'html-intro',
        title: 'Introduction to HTML',
        category: 'HTML',
        difficulty: 'Beginner',
        duration: '15 minutes',
        summary: 'Learn the basics of HTML structure and tags.',
        description: 'HTML (HyperText Markup Language) is the foundation of web development.',
        learningObjectives: [
          'Understand what HTML is and its purpose',
          'Learn basic HTML structure',
          'Create your first HTML page',
          'Use common HTML tags',
        ],
      },
    ]);
  }
};
