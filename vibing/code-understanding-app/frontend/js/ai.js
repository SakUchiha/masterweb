/**
 * AI Assistant - Groq-based implementation for web development questions
 * Uses Groq AI for HTML, CSS, and JavaScript assistance
 */
class AIAssistant {
  constructor() {
    try {
      this.knowledgeBase = null;
      this.chatMessages = document.getElementById('chatMessages');
      this.chatInput = document.getElementById('chatInput');
      this.sendButton = document.getElementById('sendButton');
      this.examplesContent = document.getElementById('examplesContent');
      this.codeEditor = document.getElementById('codeEditor');
      this.validateButton = document.getElementById('validateButton');
      this.validationResults = document.getElementById('validationResults');
      this.languageTabs = document.querySelectorAll('.language-tab');
      this.currentLanguage = 'html';

      // Only create SyntaxChecker if it's available
      try {
        this.syntaxChecker = new SyntaxChecker();
      } catch (error) {
        console.warn('SyntaxChecker not available:', error);
        this.syntaxChecker = null;
      }

      this.aiStatus = document.getElementById('aiStatus');
      this.statusRefreshBtn = document.getElementById('statusRefreshBtn');
      this.enhanceButton = document.getElementById('enhanceButton');
      this.selectedModel = 'llama-3.1-8b-instant'
      this.responseStyle = 'normal' // Default response style

      // Only initialize if essential elements are available
      if (this.chatMessages && this.chatInput && this.sendButton) {
        this.init();
      } else {
        console.error('Essential DOM elements not found:', {
          chatMessages: !!this.chatMessages,
          chatInput: !!this.chatInput,
          sendButton: !!this.sendButton
        });
      }
    } catch (error) {
      console.error('AIAssistant constructor failed:', error);
    }
  }

  async init() {
    await this.loadKnowledgeBase();
    this.setupEventListeners();
    this.loadExamples();
    this.addWelcomeMessage();
    this.checkAIStatus();

    // Initialize response style buttons
    setTimeout(() => {
      this.setResponseStyle(this.responseStyle);
    }, 100);
  }

  async loadKnowledgeBase() {
    try {
      const response = await fetch('data/ai-knowledge.json');
      this.knowledgeBase = await response.json();
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      this.knowledgeBase = { questions: [], categories: {}, code_examples: {} };
    }
  }

  setupEventListeners() {
    try {
      // Chat functionality - only if elements exist
      if (this.sendButton && this.chatInput) {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }

      // Code explanation - only if elements exist
      if (this.validateButton) {
        this.validateButton.addEventListener('click', () => this.explainCode());
      }

      // Language tabs - only if they exist
      if (this.languageTabs && this.languageTabs.length > 0) {
        this.languageTabs.forEach(tab => {
          if (tab) {
            tab.addEventListener('click', () => this.switchLanguage(tab.dataset.language));
          }
        });
      }

      // AI status refresh - only if element exists
      if (this.statusRefreshBtn) {
        this.statusRefreshBtn.addEventListener('click', () => this.checkAIStatus());
      }

      // Enhance button - only if element exists
      if (this.enhanceButton) {
        this.enhanceButton.addEventListener('click', () => this.enhancePrompt());
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  addWelcomeMessage() {
    this.addMessage('ai', '👋 Hello! I\'m Professor Groq, your coding tutor. I love teaching programming step by step! I\'ll break down complex concepts into digestible pieces and help you understand the "why" behind every line of code. What would you like to learn today?');
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    this.addMessage('user', message);
    this.chatInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Process message with Groq AI
    await this.processWithGroq(message);
  }

  // Removed client-side AI processing methods

  // Removed client-side validation and example request handlers

  async explainCode() {
    const code = this.codeEditor.value.trim();
    if (!code) {
      this.showExplanationResult('Please enter some code to explain.', 'info');
      return;
    }

    uiManager.setButtonLoading('validateButton', true, 'Analyzing...');

    try {
      // Get AI-powered explanation
      const aiExplanation = await this.explainWithAI(code, this.currentLanguage);

      if (aiExplanation) {
        this.displayAIExplanation(aiExplanation);
      } else {
        // Fallback message
        this.showExplanationResult('Unable to generate explanation. Please try again.', 'error');
      }

      // Track explanation for progress
      if (window.progressTracker) {
        window.progressTracker.incrementValidations(); // Reuse validation counter for now
      }

    } catch (error) {
      console.error('Explanation error:', error);
      uiManager.showError('Code explanation failed. Please try again.', () => this.explainCode());
      this.showExplanationResult('Unable to explain code. Please check your connection and try again.', 'error');
    } finally {
      uiManager.setButtonLoading('validateButton', false);
    }
  }

  async explainWithAI(code, language) {
    try {
      const response = await apiService.post('/api/groq', {
        code: code,
        language: language
      });

      return response;
    } catch (error) {
      console.warn('AI explanation failed:', error);
      return null;
    }
  }

  displayAIExplanation(explanation) {
    let html = '<div class="ai-explanation-results">';

    // Main explanation content
    html += '<div class="explanation-content">';
    let explanationText = explanation.response || explanation.explanation || explanation;
    explanationText = this.cleanSpecialCharacters(explanationText);
    html += `<div class="explanation-text">${this.formatResponse(explanationText)}</div>`;
    html += '</div>';

    // Add copy button for code snippets
    html += '<div class="explanation-actions">';
    html += '<button onclick="copyAllCode()" class="copy-btn"><i class="fas fa-copy"></i> Copy All Code</button>';
    html += '</div>';

    html += '</div>';
    this.validationResults.innerHTML = html;
  }

  fallbackValidation(code) {
    // Fallback to basic syntax checking
    let result;
    switch (this.currentLanguage) {
      case 'html':
        result = this.syntaxChecker.checkHTML(code);
        break;
      case 'css':
        result = this.syntaxChecker.checkCSS(code);
        break;
      case 'javascript':
        result = this.syntaxChecker.checkJavaScript(code);
        break;
    }

    this.displayValidationResults(result);
  }

  displayValidationResults(result) {
    let html = '';

    if (result.errors.length > 0) {
      html += '<div class="validation-errors">';
      html += '<h4>❌ Errors Found:</h4>';
      result.errors.forEach(error => {
        html += `<div class="validation-item error">
          <strong>Line ${error.line}:</strong> ${error.message}
          ${error.suggestion ? `<br><em>Suggestion: ${error.suggestion}</em>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    if (result.warnings.length > 0) {
      html += '<div class="validation-warnings">';
      html += '<h4>⚠️ Warnings:</h4>';
      result.warnings.forEach(warning => {
        html += `<div class="validation-item warning">
          <strong>Line ${warning.line}:</strong> ${warning.message}
          ${warning.suggestion ? `<br><em>Suggestion: ${warning.suggestion}</em>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      html = '<div class="validation-success">✅ Your code looks good! No errors or warnings found.</div>';
    }

    this.validationResults.innerHTML = html;
  }

  showExplanationResult(message, type = 'info') {
    this.validationResults.innerHTML = `<div class="explanation-${type}">${message}</div>`;
  }

  switchLanguage(language) {
    this.currentLanguage = language;

    // Update tabs
    this.languageTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.language === language);
    });

    // Remove existing syntax highlighting
    if (window.syntaxHighlighter) {
      window.syntaxHighlighter.removeHighlighting(this.codeEditor);
    }

    // Update placeholder
    const placeholders = {
      html: 'Enter your HTML code here...\n\nExample:\n<h1>Hello World</h1>\n<p>This is a paragraph.</p>',
      css: 'Enter your CSS code here...\n\nExample:\nbody {\n  font-family: Arial, sans-serif;\n  color: #333;\n}',
      javascript: 'Enter your JavaScript code here...\n\nExample:\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));'
    };

    this.codeEditor.placeholder = placeholders[language];
    this.codeEditor.value = '';

    // Apply syntax highlighting if available
    if (window.syntaxHighlighter) {
      setTimeout(() => {
        window.syntaxHighlighter.applyHighlighting(this.codeEditor, language);
      }, 100);
    }

    this.validationResults.innerHTML = '';
  }

  loadExamples() {
    try {
      if (!this.knowledgeBase || !this.knowledgeBase.code_examples) return;
      if (!this.examplesContent) return;

      let html = '';

      Object.keys(this.knowledgeBase.code_examples).forEach(language => {
        const examples = this.knowledgeBase.code_examples[language];
        examples.forEach(example => {
          html += `
            <div class="example-item" onclick="aiAssistant.loadExample('${language}', '${example.title.replace(/'/g, "\\'")}')">
              <h4>${example.title}</h4>
              <p>${example.description}</p>
              <span class="example-language">${language.toUpperCase()}</span>
            </div>
          `;
        });
      });

      this.examplesContent.innerHTML = html;
    } catch (error) {
      console.error('Error loading examples:', error);
    }
  }

  loadExample(language, title) {
    try {
      const examples = this.knowledgeBase.code_examples[language];
      const example = examples.find(ex => ex.title === title);

      if (example) {
        this.switchLanguage(language);
        this.codeEditor.value = example.code;

        // Re-apply syntax highlighting after setting value
        if (window.syntaxHighlighter) {
          setTimeout(() => {
            window.syntaxHighlighter.applyHighlighting(this.codeEditor, language);
          }, 100);
        }

        this.addMessage('ai', `I've loaded the "${title}" example into the code editor. Try modifying it and then click "Explain Code" to check for any issues!`);
      }
    } catch (error) {
      console.error('Error loading example:', error);
    }
  }

  // Clean special characters from AI responses
  cleanSpecialCharacters(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Remove control characters but keep common formatting
    return text
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\u2028\u2029]/g, ' ') // Replace line/paragraph separators with space
      .trim();
  }

  addMessage(sender, content) {
    try {
      if (!this.chatMessages) return;

      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}-message`;

      const avatar = sender === 'ai' ? '🤖' : '👤';
      const senderName = sender === 'ai' ? 'AI Assistant' : 'You';

      messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-sender">${senderName}</div>
          <div class="message-text">${this.formatResponse(content)}</div>
        </div>
      `;

      this.chatMessages.appendChild(messageDiv);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }

  showTypingIndicator() {
    try {
      if (!this.chatMessages) return;

      const indicator = document.createElement('div');
      indicator.className = 'message ai-message typing-indicator';
      indicator.id = 'typing-indicator';
      indicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-sender">AI Assistant</div>
          <div class="message-text">
            <span class="typing-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
        </div>
      `;
      this.chatMessages.appendChild(indicator);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    } catch (error) {
      console.error('Error showing typing indicator:', error);
    }
  }

  hideTypingIndicator() {
    try {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    } catch (error) {
      console.error('Error hiding typing indicator:', error);
    }
  }

  formatResponse(text) {
    // Normalize casing first
    text = this.normalizeResponseCase(text);

    // Convert markdown-style code blocks to HTML with copy buttons
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
      return `<div class="code-block-container">
        <div class="code-block-header">
          <span class="code-language">${lang || 'text'}</span>
          <button onclick="copyCodeBlock('${codeId}')" class="code-copy-btn" title="Copy code">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <pre><code id="${codeId}" class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>
      </div>`;
    });

    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Normalize inconsistent casing from AI responses (heuristic)
  normalizeResponseCase(text) {
    if (!text || typeof text !== 'string') return text;

    // If text looks like shouty/all-caps (excluding code blocks), downcase then sentence-case
    const withoutCode = text.replace(/```[\s\S]*?```/g, '');
    const letters = withoutCode.replace(/[^A-Za-z]/g, '');
    const upperCount = (letters.match(/[A-Z]/g) || []).length;
    const ratio = letters.length ? upperCount / letters.length : 0;

    if (ratio > 0.6) {
      const lowered = text.toLowerCase();
      return lowered.replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, (m) => m.toUpperCase());
    }

    // Otherwise, ensure first sentence starts with capital
    return text.replace(/(^\s*[a-z])/, (m) => m.toUpperCase());
  }

  // Enhance Prompt functionality
  async enhancePrompt() {
    const currentPrompt = this.chatInput.value.trim();
    if (!currentPrompt) {
      this.addMessage('ai', 'Please enter a prompt first before enhancing it.');
      return;
    }

    uiManager.setButtonLoading('enhanceButton', true, 'Enhancing...');

    try {
      const enhancementPrompt = `You are a prompt enhancement expert. Take this user prompt about coding/web development and make it clearer, more specific, and more likely to get a helpful response. Add context if needed, but keep it concise. Original prompt: "${currentPrompt}"

Please provide 2-3 enhanced versions of this prompt, each on a new line, starting with "Enhanced:"`;

      const response = await apiService.post('/api/groq', {
        messages: [{ role: 'user', content: enhancementPrompt }],
        model: this.selectedModel,
        responseStyle: 'brief'
      });

      uiManager.setButtonLoading('enhanceButton', false);

      if (response && response.response) {
        const enhancedPrompts = response.response.split('\n').filter(line =>
          line.trim().startsWith('Enhanced:')
        ).map(line => line.replace('Enhanced:', '').trim());

        if (enhancedPrompts.length > 0) {
          this.showEnhancementOptions(enhancedPrompts, currentPrompt);
        } else {
          this.addMessage('ai', 'I couldn\'t generate enhanced prompts. Your original prompt looks good as is!');
        }
      } else {
        this.addMessage('ai', 'Unable to enhance prompt right now. Please try again later.');
      }
    } catch (error) {
      uiManager.setButtonLoading('enhanceButton', false);
      console.error('Enhance prompt error:', error);
      this.addMessage('ai', 'Sorry, I couldn\'t enhance your prompt. Please try again.');
    }
  }

  showEnhancementOptions(enhancedPrompts, originalPrompt) {
    let message = `✨ **Enhanced Prompt Options**\n\nI've improved your prompt to get better AI responses:\n\n`;

    enhancedPrompts.forEach((prompt, index) => {
      message += `${index + 1}. "${prompt}"\n`;
    });

    message += `\n**Choose an option by clicking the button below, or keep your original:** "${originalPrompt}"`;

    this.addMessage('ai', message);

    // Add enhancement buttons after a short delay
    setTimeout(() => {
      this.addEnhancementButtons(enhancedPrompts, originalPrompt);
    }, 500);
  }

  addEnhancementButtons(enhancedPrompts, originalPrompt) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'enhancement-buttons';
    buttonContainer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    `;

    // Add buttons for each enhanced prompt
    enhancedPrompts.forEach((prompt, index) => {
      const button = document.createElement('button');
      button.textContent = `Use Option ${index + 1}`;
      button.className = 'enhancement-btn';
      button.style.cssText = `
        padding: 0.5rem 1rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s ease;
      `;
      button.onmouseover = () => button.style.background = '#5a67d8';
      button.onmouseout = () => button.style.background = '#667eea';
      button.onclick = () => {
        this.chatInput.value = prompt;
        buttonContainer.remove();
        this.addMessage('ai', `✅ Applied enhanced prompt option ${index + 1}!`);
      };
      buttonContainer.appendChild(button);
    });

    // Add button to keep original
    const keepOriginalBtn = document.createElement('button');
    keepOriginalBtn.textContent = 'Keep Original';
    keepOriginalBtn.className = 'enhancement-btn secondary';
    keepOriginalBtn.style.cssText = `
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.3s ease;
    `;
    keepOriginalBtn.onmouseover = () => keepOriginalBtn.style.background = '#5a6268';
    keepOriginalBtn.onmouseout = () => keepOriginalBtn.style.background = '#6c757d';
    keepOriginalBtn.onclick = () => {
      buttonContainer.remove();
      this.addMessage('ai', '✅ Kept your original prompt!');
    };
    buttonContainer.appendChild(keepOriginalBtn);

    // Add to the last AI message
    const lastMessage = this.chatMessages.querySelector('.message.ai-message:last-child .message-content');
    if (lastMessage) {
      lastMessage.appendChild(buttonContainer);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  // Response style controls
  setResponseStyle(style) {
    this.responseStyle = style;

    // Update button states
    const buttons = ['briefBtn', 'normalBtn', 'detailedBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.toggle('active', btnId === style + 'Btn');
      }
    });

    // Show user feedback (only for manual changes, not on load)
    if (window.responseStyleInitialized) {
      this.addMessage('ai', `✅ Response style set to: ${style.charAt(0).toUpperCase() + style.slice(1)}`);
    }
    window.responseStyleInitialized = true;
  }

  // Copy functions
  copyCodeBlock(codeId) {
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent).then(() => {
        // Show temporary success feedback
        const btn = codeElement.parentElement.previousElementSibling.querySelector('.code-copy-btn');
        if (btn) {
          const originalIcon = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          btn.style.color = '#28a745';
          setTimeout(() => {
            btn.innerHTML = originalIcon;
            btn.style.color = '';
          }, 1000);
        }
      });
    }
  }

  // Model and setup suggestions
  showModelSuggestion(suggestion) {
    const message = `💡 **Model Suggestion:** ${suggestion}

To get the best AI experience, make sure your Groq API key is configured in the backend .env file.`;

    this.addMessage('ai', message);
  }

  showSetupSuggestion(suggestions) {
    let message = `🚀 **Setup Required:** AI assistant needs a Groq API key to work.

**Quick Setup Steps:**
1. Get API key: https://console.groq.com/
2. Add to backend .env: GROQ_API_KEY=your_key_here
3. Restart the server

**Why Groq?**
• Ultra-fast AI inference with Llama 3 models
• Professional code analysis and explanations
• Advanced understanding of web development
• Perfect for learning and professional development

Once setup is complete, refresh this page to start chatting with AI! 🤖`;

    this.addMessage('ai', message);
  }

  // AI Status checking
  async checkAIStatus() {
    if (!this.aiStatus) return;

    try {
      this.aiStatus.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking AI status...';
      this.aiStatus.className = 'ai-status checking';

      const response = await apiService.get('/api/groq/health');

      if (response.status === 'healthy') {
        this.aiStatus.innerHTML = `<i class="fas fa-check-circle"></i> AI Ready`;
        this.aiStatus.className = 'ai-status healthy';
        this.aiStatus.title = `Groq AI configured and ready`;
      } else {
        this.aiStatus.innerHTML = '<i class="fas fa-times-circle"></i> AI Unavailable';
        this.aiStatus.className = 'ai-status unhealthy';
        this.aiStatus.title = response.suggestions.join('\n');

        // Show setup suggestions
        if (response.suggestions.length > 0) {
          setTimeout(() => {
            this.showSetupSuggestion(response.suggestions);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      this.aiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Status Check Failed';
      this.aiStatus.className = 'ai-status error';
      this.aiStatus.title = 'Unable to check AI status. Backend may not be running.';
    }
  }

  // Fallback responses for common questions when AI is unavailable
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Enhanced code-related question detection
    const codeKeywords = [
      'code', 'javascript', 'html', 'css', 'function', 'variable', 'class', 'method',
      'array', 'object', 'loop', 'condition', 'if', 'else', 'for', 'while', 'switch',
      'dom', 'api', 'fetch', 'async', 'await', 'promise', 'callback', 'event',
      'element', 'tag', 'selector', 'style', 'responsive', 'framework', 'library',
      'react', 'vue', 'angular', 'node', 'express', 'database', 'sql', 'mongodb',
      'git', 'github', 'debug', 'error', 'bug', 'fix', 'troubleshoot', 'optimize',
      'performance', 'security', 'testing', 'validation', 'syntax', 'structure',
      'algorithm', 'data structure', 'recursion', 'iteration', 'scope', 'closure',
      'prototype', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction'
    ];

    // Check if this is a code-related question
    const isCodeQuestion = codeKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isCodeQuestion) {
      return this.getCodeSpecificResponse(lowerMessage);
    }

    // Enhanced generic fallback for other questions
  }

  // Enhanced code-specific responses
  getCodeSpecificResponse(message) {
    // HTML-related questions
    if (message.includes('html')) {
      return this.getHTMLResponse(message);
    }

    // CSS-related questions
    if (message.includes('css')) {
      return this.getCSSResponse(message);
    }

    // JavaScript-related questions
    if (message.includes('javascript') || message.includes('js')) {
      return this.getJavaScriptResponse(message);
    }

    // General code questions
    return this.getGeneralCodeResponse(message);
  }

  getHTMLResponse(message) {
    if (message.includes('form') || message.includes('input') || message.includes('button')) {
      return `📝 **HTML Forms - Step by Step Guide**

**Step 1: Understanding Forms**
Forms are how users interact with web applications. They collect data and send it to servers.

**Step 2: Basic Form Structure**
\`\`\`html
<form action="/submit" method="POST">
    <!-- Form elements go here -->
</form>
\`\`\`

**Step 3: Input Types**
• **text** - Single line text input
• **email** - Email validation
• **password** - Hidden text input
• **number** - Numeric input only
• **date** - Date picker
• **checkbox** - Multiple selections
• **radio** - Single selection from options

**Step 4: Form Elements**
\`\`\`html
<label for="username">Username:</label>
<input type="text" id="username" name="username" required>

<label for="email">Email:</label>
<input type="email" id="email" name="email" required>

<button type="submit">Submit</button>
\`\`\`

**Step 5: Form Validation**
• **required** - Must be filled
• **minlength/maxlength** - Text length limits
• **pattern** - Regular expression validation

**What type of form are you building?** 🎯`;
    }

    if (message.includes('table') || message.includes('data')) {
      return `📊 **HTML Tables - Step by Step Guide**

**Step 1: Table Structure**
\`\`\`html
<table>
    <thead>
        <tr>
            <th>Header 1</th>
            <th>Header 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Data 1</td>
            <td>Data 2</td>
        </tr>
    </tbody>
</table>
\`\`\`

**Step 2: Table Elements**
• **<table>** - Main container
• **<thead>** - Header section
• **<tbody>** - Body content
• **<tr>** - Table row
• **<th>** - Header cell
• **<td>** - Data cell

**Step 3: Advanced Features**
• **colspan** - Span multiple columns
• **rowspan** - Span multiple rows
• **<caption>** - Table title

**Step 4: Professional Styling**
\`\`\`css
table {
    border-collapse: collapse;
    width: 100%;
}
th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
th {
    background-color: #f2f2f2;
}
\`\`\`

**What data do you want to display in your table?** 📋`;
    }

    // Default HTML response
    return this.getDefaultHTMLResponse();
  }

  getDefaultHTMLResponse() {
    return `🎓 **HTML Elements - Step by Step Learning**

**Step 1: Understanding HTML Structure**
HTML (HyperText Markup Language) is the foundation of web pages. Think of it like building blocks for a house.

**Step 2: Basic Elements**
• \`<html>\` - The main container (like the foundation)
• \`<head>\` - Hidden information (like the blueprint)
• \`<body>\` - Visible content (like the rooms)

**Step 3: Content Elements**
• \`<h1>\` - Main heading (big and important)
• \`<p>\` - Paragraph text (normal size)
• \`<div>\` - Container (like a room divider)

**Step 4: Interactive Elements**
• \`<a href="url">\` - Links (connect pages)
• \`<img src="path" alt="description">\` - Images (visual content)
• \`<button>\` - Clickable buttons (user interaction)

**Step 5: Professional Example**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My First Page</title>
</head>
<body>
    <h1>Welcome to Web Development!</h1>
    <p>This is a paragraph explaining HTML.</p>
    <div>
        <img src="image.jpg" alt="Learning HTML">
        <button>Click Me!</button>
    </div>
</body>
</html>
\`\`\`

**Step 6: Practice Exercise**
Try creating your own HTML page with:
1. A main heading
2. A paragraph explaining what you learned
3. An image with alt text
4. A link to your favorite website

**What would you like to learn next?** 🎯`;
  }

  getCSSResponse(message) {
    if (message.includes('flexbox') || message.includes('flex')) {
      return `🎯 **CSS Flexbox - Step by Step Guide**

**Step 1: What is Flexbox?**
Flexbox is a layout system that makes it easy to arrange items in rows or columns with perfect alignment.

**Step 2: Container Setup**
\`\`\`css
.container {
    display: flex;        /* Enable flexbox */
    justify-content: center;  /* Horizontal alignment */
    align-items: center;      /* Vertical alignment */
}
\`\`\`

**Step 3: Main Properties**
• **justify-content** - Horizontal alignment (flex-start, center, flex-end, space-between, space-around)
• **align-items** - Vertical alignment (flex-start, center, flex-end, stretch)
• **flex-direction** - Direction (row, column, row-reverse, column-reverse)

**Step 4: Item Properties**
\`\`\`css
.item {
    flex-grow: 1;     /* Take available space */
    flex-shrink: 0;   /* Don't shrink */
    flex-basis: 200px; /* Initial size */
    /* Short way: */
    flex: 1 0 200px;
}
\`\`\`

**Step 5: Professional Layout Example**
\`\`\`css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #333;
    color: white;
}

.nav-links {
    display: flex;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background 0.3s;
}

.nav-links a:hover {
    background: rgba(255,255,255,0.1);
}
\`\`\`

**Step 6: Responsive Design**
\`\`\`css
/* Mobile first */
.flex-container {
    display: flex;
    flex-wrap: wrap;  /* Allow wrapping */
}

/* Desktop */
@media (min-width: 768px) {
    .flex-container {
        flex-wrap: nowrap;
    }
}
\`\`\`

**What layout are you trying to create?** 🎨`;
    }

    if (message.includes('grid') || message.includes('layout')) {
      return `🔲 **CSS Grid - Step by Step Guide**

**Step 1: What is CSS Grid?**
CSS Grid is a powerful 2-dimensional layout system that lets you create complex layouts with rows and columns.

**Step 2: Container Setup**
\`\`\`css
.grid-container {
    display: grid;                    /* Enable grid */
    grid-template-columns: 1fr 1fr;   /* Two equal columns */
    grid-template-rows: auto;         /* Auto-sized rows */
    gap: 20px;                        /* Space between items */
}
\`\`\`

**Step 3: Grid Template Areas**
\`\`\`css
.grid-container {
    display: grid;
    grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr auto;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
\`\`\`

**Step 4: Responsive Grid**
\`\`\`css
/* Mobile: single column */
.grid-container {
    grid-template-columns: 1fr;
    grid-template-areas:
        "header"
        "main"
        "sidebar"
        "footer";
}

/* Tablet: two columns */
@media (min-width: 768px) {
    .grid-container {
        grid-template-columns: 1fr 300px;
        grid-template-areas:
            "header header"
            "main sidebar"
            "footer footer";
    }
}
\`\`\`

**Step 5: Professional Grid Layout**
\`\`\`css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 2rem;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-4px);
}
\`\`\`

**What kind of layout are you building?** 📐`;
    }

    // Default CSS response
    return this.getDefaultCSSResponse();
  }

  getDefaultCSSResponse() {
    return `🎨 **CSS Styling - Step by Step Tutorial**

**Step 1: What is CSS?**
CSS (Cascading Style Sheets) is like the interior design of your webpage. HTML provides the structure, CSS makes it beautiful!

**Step 2: How CSS Works**
1. **Selector** - What you want to style (\`h1\`, \`.class\`, \`#id\`)
2. **Property** - What aspect to change (\`color\`, \`font-size\`)
3. **Value** - The new setting (\`red\`, \`16px\`)

**Step 3: Color Methods**
• **Named colors:** \`color: red;\` (simple but limited)
• **Hex codes:** \`color: #FF0000;\` (most popular)
• **RGB:** \`color: rgb(255, 0, 0);\` (precise control)
• **HSL:** \`color: hsl(0, 100%, 50%);\` (intuitive)

**Step 4: Typography Basics**
\`\`\`css
/* Font family (fallback chain) */
font-family: Arial, Helvetica, sans-serif;

/* Size options */
font-size: 16px;        /* pixels */
font-size: 1rem;        /* relative units */
font-size: 100%;        /* percentage */

/* Weight variations */
font-weight: normal;    /* 400 */
font-weight: bold;      /* 700 */
font-weight: 300;       /* light */
\`\`\`

**Step 5: Layout & Spacing**
\`\`\`css
/* Spacing (margin = external, padding = internal) */
margin: 20px;           /* all sides */
padding: 10px 20px;     /* top-bottom, left-right */

/* Layout methods */
display: flex;          /* modern flexible layouts */
display: grid;          /* powerful grid systems */
\`\`\`

**Step 6: Practice Exercise**
1. Create HTML with headings and paragraphs
2. Add CSS to change colors and fonts
3. Experiment with different spacing values
4. Try flexbox for centering content

**Ready to style your first webpage?** 🚀

**What specific styling would you like to learn?**`;
  }

  getJavaScriptResponse(message) {
    if (message.includes('array') || message.includes('list')) {
      return `📋 **JavaScript Arrays - Step by Step Guide**

**Step 1: What are Arrays?**
Arrays are ordered lists that can hold multiple values. Think of them like shopping lists or numbered boxes.

**Step 2: Creating Arrays**
\`\`\`javascript
// Method 1: Array literal (recommended)
const fruits = ['apple', 'banana', 'orange'];

// Method 2: Array constructor
const numbers = new Array(1, 2, 3, 4, 5);

// Method 3: Empty array
const empty = [];
\`\`\`

**Step 3: Accessing Elements**
\`\`\`javascript
const colors = ['red', 'blue', 'green'];

// Access by index (starts at 0)
console.log(colors[0]);  // 'red'
console.log(colors[1]);  // 'blue'

// Length property
console.log(colors.length);  // 3
\`\`\`

**Step 4: Common Array Methods**
\`\`\`javascript
const tasks = ['learn', 'practice', 'build'];

// Add to end
tasks.push('deploy');  // ['learn', 'practice', 'build', 'deploy']

// Remove from end
tasks.pop();  // ['learn', 'practice', 'build']

// Add to beginning
tasks.unshift('plan');  // ['plan', 'learn', 'practice', 'build']

// Remove from beginning
tasks.shift();  // ['learn', 'practice', 'build']
\`\`\`

**Step 5: Array Iteration**
\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Method 1: forEach (execute for each item)
numbers.forEach((number, index) => {
    console.log(\`Number \${index}: \${number}\`);
});

// Method 2: map (transform each item)
const doubled = numbers.map(num => num * 2);
console.log(doubled);  // [2, 4, 6, 8, 10]

// Method 3: filter (keep items that match condition)
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log(evenNumbers);  // [2, 4]
\`\`\`

**Step 6: Advanced Array Methods**
\`\`\`javascript
const scores = [85, 92, 78, 96, 88];

// Find specific item
const highScore = scores.find(score => score > 90);  // 92

// Check if all items match condition
const allPassing = scores.every(score => score >= 70);  // true

// Check if any item matches condition
const hasPerfect = scores.some(score => score === 100);  // false

// Sort array
const sortedScores = [...scores].sort((a, b) => b - a);  // [96, 92, 88, 85, 78]
\`\`\`

**Step 7: Practice Exercise**
1. Create an array of your favorite foods
2. Add and remove items from the array
3. Use map to transform the array (e.g., make all uppercase)
4. Use filter to find items that meet a condition

**What would you like to do with arrays?** 🔢`;
    }

    if (message.includes('object') || message.includes('property')) {
      return `🏗️ **JavaScript Objects - Step by Step Guide**

**Step 1: What are Objects?**
Objects are collections of key-value pairs. Think of them like dictionaries or like a person's profile with different attributes.

**Step 2: Creating Objects**
\`\`\`javascript
// Method 1: Object literal (recommended)
const person = {
    name: 'Alice',
    age: 25,
    isStudent: true,
    hobbies: ['reading', 'coding']
};

// Method 2: Object constructor
const car = new Object();
car.make = 'Toyota';
car.model = 'Camry';
car.year = 2023;
\`\`\`

**Step 3: Accessing Properties**
\`\`\`javascript
const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: 30
};

// Dot notation (recommended)
console.log(user.firstName);  // 'John'
console.log(user.age);        // 30

// Bracket notation (for dynamic access)
const property = 'email';
console.log(user[property]);  // 'john@example.com'
\`\`\`

**Step 4: Modifying Objects**
\`\`\`javascript
const settings = {
    theme: 'light',
    notifications: true,
    language: 'en'
};

// Add new property
settings.volume = 80;

// Update existing property
settings.theme = 'dark';

// Delete property
delete settings.language;
\`\`\`

**Step 5: Object Methods**
\`\`\`javascript
const calculator = {
    // Method (function inside object)
    add: function(a, b) {
        return a + b;
    },

    // Shorthand method (ES6+)
    multiply(a, b) {
        return a * b;
    },

    // Arrow function method
    divide: (a, b) => a / b
};

// Using methods
console.log(calculator.add(5, 3));     // 8
console.log(calculator.multiply(4, 6)); // 24
\`\`\`

**Step 6: Advanced Object Features**
\`\`\`javascript
// Destructuring
const { name, age } = person;
console.log(name, age);  // 'Alice' 25

// Spread operator
const newPerson = { ...person, city: 'New York' };

// Object.keys() - get all property names
console.log(Object.keys(person));  // ['name', 'age', 'isStudent', 'hobbies']

// Object.values() - get all property values
console.log(Object.values(person));  // ['Alice', 25, true, [...]]

// Object.entries() - get key-value pairs
console.log(Object.entries(person));
\`\`\`

**Step 7: Practice Exercise**
1. Create an object representing a book (title, author, pages, genre)
2. Add methods to calculate reading time and get book info
3. Create an array of book objects
4. Use map to extract all book titles

**What kind of object are you working with?** 📚`;
    }

    if (message.includes('loop') || message.includes('repeat') || message.includes('iterate')) {
      return `🔄 **JavaScript Loops - Step by Step Guide**

**Step 1: What are Loops?**
Loops are programming structures that repeat actions. They save time and reduce code duplication.

**Step 2: For Loop (counting)**
\`\`\`javascript
// Basic structure:
// for (initialization; condition; increment) { code }

for (let i = 0; i < 5; i++) {
    console.log('Count:', i);  // 0, 1, 2, 3, 4
}
\`\`\`

**Step 3: While Loop (condition-based)**
\`\`\`javascript
// Basic structure:
// while (condition) { code }

let count = 0;
while (count < 3) {
    console.log('While count:', count);
    count++;  // Important: increment or you'll have infinite loop!
}
\`\`\`

**Step 4: For...of Loop (array iteration)**
\`\`\`javascript
const fruits = ['apple', 'banana', 'orange'];

for (const fruit of fruits) {
    console.log('I like', fruit);
}
// Output: I like apple, I like banana, I like orange
\`\`\`

**Step 5: For...in Loop (object properties)**
\`\`\`javascript
const person = {
    name: 'Alice',
    age: 25,
    city: 'Boston'
};

for (const property in person) {
    console.log(property + ':', person[property]);
}
// Output: name: Alice, age: 25, city: Boston
\`\`\`

**Step 6: Loop Control**
\`\`\`javascript
// break - exit loop immediately
for (let i = 0; i < 10; i++) {
    if (i === 5) break;
    console.log(i);  // 0, 1, 2, 3, 4
}

// continue - skip current iteration
for (let i = 0; i < 5; i++) {
    if (i === 2) continue;
    console.log(i);  // 0, 1, 3, 4
}
\`\`\`

**Step 7: Nested Loops**
\`\`\`javascript
// Multiplication table
for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
        console.log(\`\${i} x \${j} = \${i * j}\`);
    }
}
\`\`\`

**Step 8: Practice Exercise**
1. Create a loop that counts from 10 to 1
2. Loop through an array and find the largest number
3. Create a nested loop to generate a grid pattern
4. Use loops to validate user input until it's correct

**What are you trying to repeat or iterate over?** 🔁`;
    }

    // Default JavaScript response
    return this.getDefaultJavaScriptResponse();
  }

  getDefaultJavaScriptResponse() {
    return `⚡ **JavaScript Variables - Step by Step Guide**

**Step 1: What are Variables?**
Variables are like labeled boxes where you store information. You give each box a name and put data inside it.

**Step 2: Variable Declaration**
JavaScript has three ways to create variables:

1. **const** (recommended) - Cannot be changed after creation
2. **let** (modern) - Can be changed, stays within curly braces
3. **var** (old) - Can be changed, but avoid in modern code

**Step 3: Declaration Examples**
\`\`\`javascript
// Step 1: Declare and assign
const myName = "Alice";        // Text (string)
let myAge = 25;               // Number
let isStudent = true;         // True/false (boolean)

// Step 2: Use the variables
console.log("Hello, " + myName);  // "Hello, Alice"
console.log("Age:", myAge);       // "Age: 25"

// Step 3: Change let variables (const cannot change)
myAge = 26;
console.log("New age:", myAge);   // "New age: 26"
\`\`\`

**Step 4: Data Types**
• **String:** Text in quotes - \`"Hello World"\`
• **Number:** Numbers - \`42, 3.14, -10\`
• **Boolean:** True/false - \`true, false\`
• **Array:** Lists - \`[1, 2, 3, "text"]\`
• **Object:** Key-value pairs - \`{name: "John", age: 30}\`

**Step 5: Naming Rules**
✅ **Good names:** \`firstName, user_age, MAX_SIZE\`
❌ **Bad names:** \`1name, user-age, class\` (hyphens)

**Step 6: Practice Exercise**
1. Create a variable for your favorite color
2. Create a variable for your birth year
3. Calculate and store your age
4. Display a message using all variables

**Which data type would you like to explore next?** 🎯`;
  }

  getGeneralCodeResponse(message) {
    if (message.includes('debug') || message.includes('error') || message.includes('fix')) {
      return `🐛 **Debugging Code - Step by Step Problem Solving**

**Step 1: Understanding Errors**
When code doesn't work, JavaScript gives you clues through error messages. Don't panic - errors are your friends! They tell you exactly what went wrong.

**Step 2: Common Error Types**
1. **SyntaxError** - "You wrote something wrong"
   - Missing semicolons, brackets, or quotes
   - Typos in keywords

2. **ReferenceError** - "I can't find that thing"
   - Using a variable that doesn't exist
   - Forgetting to declare variables

3. **TypeError** - "That's not the right type"
   - Trying to use methods on wrong data types
   - Calling functions with wrong arguments

**Step 3: Debugging Process**
\`\`\`javascript
// Step 1: Check for obvious errors
console.log("Starting debug...");

// Step 2: Add logging to see what's happening
function calculateArea(width, height) {
    console.log("Width:", width);    // Check inputs
    console.log("Height:", height);

    let area = width * height;
    console.log("Area:", area);      // Check calculation

    return area;
}

// Step 3: Test with simple values
console.log(calculateArea(5, 10));   // Should be 50
\`\`\`

**Step 4: Browser Developer Tools (F12)**
1. **Console tab** - See error messages and your logs
2. **Sources tab** - Set breakpoints to pause code
3. **Network tab** - Check API calls
4. **Elements tab** - Inspect HTML structure

**Step 5: Error Prevention Tips**
• Use \`console.log()\` to check variable values
• Test with simple examples first
• Read error messages carefully
• Use proper variable declarations (\`const/let\`)

**Step 6: Practice Debugging**
1. Write code that has an obvious error
2. Look at the error message in console
3. Fix the error step by step
4. Test with different inputs

**What's the error message you're seeing?** 🔍`;
    }

    if (message.includes('best practice') || message.includes('standard') || message.includes('professional')) {
      return `🏆 **Professional Coding Standards - Step by Step**

**Step 1: Why Standards Matter**
Professional code is readable, maintainable, and scalable. It follows industry conventions that make collaboration easier.

**Step 2: Naming Conventions**
\`\`\`javascript
// ✅ Good naming
const userFirstName = "Alice";     // camelCase for variables
const MAX_USER_AGE = 120;         // UPPER_CASE for constants
function calculateUserAge() {}     // camelCase for functions

// ❌ Bad naming
const a = "Alice";                 // Too short, unclear
const user_first_name = "Alice";   // snake_case (Python style)
const userfirstname = "Alice";     // No separation
\`\`\`

**Step 3: Code Structure**
\`\`\`javascript
// ✅ Well-structured
function processUserData(userId) {
    // Validate input
    if (!userId || typeof userId !== 'number') {
        throw new Error('Invalid user ID');
    }

    try {
        const userData = fetchUserData(userId);
        return formatUserData(userData);
    } catch (error) {
        console.error('Processing failed:', error);
        return null;
    }
}

// ❌ Poor structure
function p(u) {
    if(u) return f(u);
}
\`\`\`

**Step 4: Comments and Documentation**
\`\`\`javascript
/**
 * Calculates the total price including tax
 * @param {number} price - Base price before tax
 * @param {number} taxRate - Tax rate as decimal (0.08 for 8%)
 * @returns {number} Total price including tax
 */
function calculateTotalPrice(price, taxRate) {
    // Validate inputs
    if (typeof price !== 'number' || price < 0) {
        throw new Error('Price must be a positive number');
    }

    const taxAmount = price * taxRate;
    const total = price + taxAmount;

    return Math.round(total * 100) / 100; // Round to 2 decimal places
}
\`\`\`

**Step 5: Error Handling**
\`\`\`javascript
// ✅ Professional error handling
try {
    const result = riskyOperation();
    return result;
} catch (error) {
    console.error('Operation failed:', error.message);
    // Log to external service in production
    throw new Error('Unable to complete operation');
} finally {
    // Cleanup code (always runs)
    closeConnections();
}
\`\`\`

**Step 6: Modern JavaScript Features**
• Use **const/let** instead of var
• Use **arrow functions** for callbacks
• Use **template literals** for string interpolation
• Use **destructuring** for cleaner code
• Use **async/await** instead of callbacks

**What coding standard would you like to focus on?** 📋`;
    }

    // Generic code response
    return `💻 **General Programming Help**

I can help you with any coding question! Here are some areas I specialize in:

**Web Development:**
• HTML structure and semantic markup
• CSS styling and responsive design
• JavaScript interactivity and logic

**Programming Concepts:**
• Variables and data types
• Functions and methods
• Loops and conditionals
• Objects and arrays

**Advanced Topics:**
• Error handling and debugging
• Code organization and best practices
• Performance optimization
• Security considerations

**Step 1: Clarify Your Question**
Before I provide a detailed answer, could you tell me:

1. **What programming language** are you working with?
2. **What specific task** are you trying to accomplish?
3. **What part** are you stuck on or confused about?
4. **Do you have any existing code** you'd like me to look at?

**What would you like help with today?** 🎯`;
  }

  async processWithGroq(message) {
    try {
      uiManager.setButtonLoading('sendButton', true, 'Thinking...');

      const response = await apiService.post('/api/groq', {
        messages: [{ role: 'user', content: message }],
        model: this.selectedModel,
        responseStyle: this.responseStyle
      });

      console.log('AI Response received:', response);

      uiManager.setButtonLoading('sendButton', false);
      this.hideTypingIndicator();

      let reply = response.response || (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) || "Sorry, I couldn't generate a response.";
      
      // Clean special characters from AI response
      reply = this.cleanSpecialCharacters(reply);
      
      console.log('Extracted reply:', reply);
      this.addMessage('ai', this.formatResponse(reply));

      // Track AI interaction for progress
      if (window.progressTracker) {
        window.progressTracker.incrementAIInteractions();
      }

    } catch (error) {
      uiManager.setButtonLoading('sendButton', false);
      this.hideTypingIndicator();
      console.error('Groq API error:', error);
      console.log('Error message:', error.message);
      console.log('Error type:', error.name);

      // Enhanced error handling with detailed guidance
      let userMessage = CONFIG.MESSAGES.AI_UNAVAILABLE;
      let suggestions = [];

      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        userMessage = `Groq API Configuration Required

Professional Setup Steps:
1. Get Groq API key: https://console.groq.com/
2. Add to backend .env file: GROQ_API_KEY=your_key_here
3. Restart server: npm start
4. Refresh this page

Why Groq?
- Ultra-fast AI inference with Llama 3.1 models
- Professional-grade code analysis
- FREE access to powerful AI models
- Industry-leading performance for developers

Need Help? Check README.md for complete setup guide.`;
        suggestions = [
          'Get Groq API key from https://console.groq.com/',
          'Add GROQ_API_KEY to backend .env file',
          'Restart the backend server',
          'Refresh this page'
        ];
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        userMessage = `Groq Rate Limit - Professional Usage Tips

What happened:
- Free tier has usage limits (typically 100 requests/hour)
- This is normal for professional AI services

Professional Solutions:
- Wait 5-10 minutes before trying again
- Consider upgrading to paid tier for higher limits
- Use the enhanced fallback responses (still professional!)
- Your code will continue to work during rate limits

Why this happens:
- Groq AI provides enterprise-level responses
- Quality AI requires computational resources
- Free tier is generous but has reasonable limits`;
        suggestions = [
          'Wait 5-10 minutes for rate limit reset',
          'Check Groq dashboard for usage at https://console.groq.com/',
          'Consider upgrading for unlimited access',
          'Use professional fallback responses in the meantime'
        ];
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        userMessage = `Network Connection - Professional Troubleshooting

Connection Issue Detected:
- Unable to reach Groq AI service
- This affects AI responses but not core functionality

Professional Solutions:
1. Check Connection: Verify internet connectivity
2. Wait and Retry: AI services can be temporarily busy
3. Fallback Mode: Professional responses still available
4. Browser Tools: Check console for detailed errors

Why this matters:
- Enterprise AI services require stable connections
- Professional development includes handling network issues
- Your learning continues with comprehensive fallbacks

Tip: Use browser dev tools (F12) to diagnose network issues.`;
        suggestions = [
          'Check your internet connection stability',
          'Wait a moment and try again',
          'Professional fallback responses are available',
          'Check browser console (F12) for network details'
        ];
      } else {
        userMessage = `AI Service - Professional Error Handling

Error Details: ${error.message}

Professional Troubleshooting Steps:
1. Restart Server: Sometimes resolves temporary issues
2. Verify Configuration: Check API key and network
3. Fallback Mode: Professional responses still available
4. Browser Console: Check F12 for detailed diagnostics

Why errors happen:
- AI services are complex distributed systems
- Professional development includes robust error handling
- Your application continues to function with fallbacks

Next Steps:
- Try refreshing the page
- Check server logs for detailed error information
- Verify all configurations in README.md

Developer Tip: Professional applications always include comprehensive error handling.`;
        suggestions = [
          'Restart the backend server',
          'Verify Groq API key is correctly configured',
          'Refresh this page to retry',
          'Check browser console (F12) for detailed error information'
        ];
      }

      // Try fallback responses for common questions when AI is unavailable
      const fallbackResponse = this.getFallbackResponse(message);
      console.log('AI Error - checking fallback for message:', message);
      console.log('Fallback response available:', !!fallbackResponse);

      if (fallbackResponse) {
        console.log('Using fallback response');
        this.addMessage('ai', fallbackResponse);
        return;
      }

      console.log('No fallback available, showing error message');
      this.addMessage('ai', userMessage);
      uiManager.showError(userMessage, () => this.processWithGroq(message));
    }
  }
}

// Global functions for HTML onclick handlers
function setResponseStyle(style) {
  if (aiAssistant) {
    aiAssistant.setResponseStyle(style);
  }
}

function copyCodeBlock(codeId) {
  if (aiAssistant) {
    aiAssistant.copyCodeBlock(codeId);
  }
}

function copyAllCode() {
  // Copy all code blocks in the current explanation
  const codeBlocks = document.querySelectorAll('.ai-explanation-results code');
  let allCode = '';
  codeBlocks.forEach(block => {
    allCode += block.textContent + '\n\n';
  });

  if (allCode.trim()) {
    navigator.clipboard.writeText(allCode.trim()).then(() => {
      // Show feedback by finding the copy button
      const copyBtn = document.querySelector('.ai-explanation-results .copy-btn');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Check icon Copied!';
        copyBtn.style.backgroundColor = '#28a745';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.backgroundColor = '';
        }, 2000);
      }
    }).catch(error => {
      console.error('Failed to copy code:', error);
      // Fallback: try to use deprecated method for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = allCode.trim();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        // Show feedback
        const copyBtn = document.querySelector('.ai-explanation-results .copy-btn');
        if (copyBtn) {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = 'Check icon Copied!';
          copyBtn.style.backgroundColor = '#28a745';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = '';
          }, 2000);
        }
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
        alert('Code copied to clipboard!');
      }
    });
  }
}

// Initialize when DOM is loaded
let aiAssistant;
document.addEventListener('DOMContentLoaded', () => {
  try {
    aiAssistant = new AIAssistant();
    console.log('AI Assistant initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI Assistant:', error);
    // Show error message to user
    const aiContainer = document.querySelector('.ai-container');
    if (aiContainer) {
      aiContainer.innerHTML = `
        <div class="ai-error-message" style="padding: 2rem; text-align: center; color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 2rem;">
          <h2>❌ AI Assistant Error</h2>
          <p>Failed to load AI Assistant. Please refresh the page or contact support.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
        </div>
      `;
    }
  }
});
