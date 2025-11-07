/**
 * Deployment Testing Script
 * 
 * This script tests all API endpoints after deployment.
 * Run this after deploying to Vercel to verify everything works.
 * 
 * Usage:
 *   node test-deployment.js <your-vercel-url>
 * 
 * Example:
 *   node test-deployment.js https://your-project.vercel.app
 */

const fetch = require('node-fetch').default;

const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log('🧪 Testing Deployment');
console.log('='.repeat(50));
console.log(`Base URL: ${BASE_URL}\n`);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

async function testHealthEndpoint() {
  console.log('\n1. Testing Health Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/groq/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      logSuccess('Health check passed - API key is configured correctly');
      return true;
    } else {
      logError(`Health check failed: ${data.status}`);
      if (data.suggestions) {
        data.suggestions.forEach(suggestion => {
          logInfo(`  - ${suggestion}`);
        });
      }
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testGroqAPI() {
  console.log('\n2. Testing Groq API...');
  try {
    const response = await fetch(`${BASE_URL}/api/groq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Say "Hello, deployment test successful!" in one sentence.' }
        ],
        model: 'llama-3.1-8b-instant'
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.response) {
      if (data.fallback) {
        logSuccess('Groq API is using fallback mode (expected for demo/testing)');
        logInfo(`Response: ${data.response.substring(0, 100)}...`);
        return true;
      } else {
        logSuccess('Groq API is working correctly');
        logInfo(`Response preview: ${data.response.substring(0, 100)}...`);
        return true;
      }
    } else {
      logError(`API request failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`API request failed: ${error.message}`);
    return false;
  }
}

async function testCodeExplanation() {
  console.log('\n3. Testing Code Explanation...');
  try {
    const response = await fetch(`${BASE_URL}/api/groq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'function hello() { console.log("Hello"); }',
        language: 'javascript',
        responseStyle: 'brief'
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.response) {
      if (data.fallback) {
        logSuccess('Code explanation is using fallback mode (expected for demo/testing)');
        return true;
      } else {
        logSuccess('Code explanation is working correctly');
        logInfo(`Response preview: ${data.response.substring(0, 100)}...`);
        return true;
      }
    } else {
      logError(`Code explanation failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Code explanation failed: ${error.message}`);
    return false;
  }
}

async function testLessonsAPI() {
  console.log('\n4. Testing Lessons API...');
  try {
    const response = await fetch(`${BASE_URL}/api/lessons`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data)) {
      logSuccess(`Lessons API is working - Found ${data.length} lessons`);
      if (data.length > 0) {
        logInfo(`First lesson: ${data[0].title || data[0].id}`);
      }
      return true;
    } else {
      logError(`Lessons API failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Lessons API failed: ${error.message}`);
    return false;
  }
}

async function testHomePage() {
  console.log('\n5. Testing Home Page...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    
    if (response.ok) {
      const text = await response.text();
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        logSuccess('Home page is loading correctly');
        return true;
      } else {
        logError('Home page returned invalid content');
        return false;
      }
    } else {
      logError(`Home page failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Home page failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const results = {
    health: await testHealthEndpoint(),
    groq: await testGroqAPI(),
    codeExplanation: await testCodeExplanation(),
    lessons: await testLessonsAPI(),
    homePage: await testHomePage(),
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✓' : '✗';
    const color = passed ? colors.green : colors.red;
    console.log(`${color}${icon}${colors.reset} ${test}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log(`\n${colors.green}🎉 All tests passed! Deployment is successful!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed. Please check the errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

