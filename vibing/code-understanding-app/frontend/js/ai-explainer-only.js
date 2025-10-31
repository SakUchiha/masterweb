/**
 * AI Explainer Only - Code validation interface for Code Explainer page
 * Handles only the code validation functionality without chat
 */
class AIValidatorOnly {
  constructor() {
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeElements());
    } else {
      this.initializeElements();
    }
  }

  initializeElements() {
    this.codeEditor = document.getElementById("codeEditor");
    this.validateButton = document.getElementById("validateButton");
    this.validationResults = document.getElementById("validationResults");
    this.examplesContent = document.getElementById("examplesContent");
    this.languageTabs = document.querySelectorAll(".language-tab");
    this.currentLanguage = "html";

    // Check if all required elements exist
    if (!this.codeEditor || !this.validateButton || !this.validationResults || !this.examplesContent) {
      console.error('AI Explainer: Required DOM elements not found', {
        codeEditor: !!this.codeEditor,
        validateButton: !!this.validateButton,
        validationResults: !!this.validationResults,
        examplesContent: !!this.examplesContent
      });
      return;
    }

    // SyntaxChecker may not be included on every page (some pages only include ai-explainer-only.js).
    // Guard its use and lazy-load the script if it's missing to avoid a ReferenceError in pages
    // that don't include `syntax-checker.js` in their HTML.
    if (typeof SyntaxChecker !== "undefined" && SyntaxChecker) {
      this.syntaxChecker = new SyntaxChecker();
    } else {
      this.syntaxChecker = null;
      // Attempt to lazily load the syntax checker in the background.
      // Failure to load will be handled gracefully when validation is requested.
      this.loadSyntaxChecker().catch(() => {
        console.warn(
          "syntax-checker.js failed to load; validation will be unavailable."
        );
      });
    }

    this.init();
  }

  init() {
    if (!this.validateButton) {
      console.error('Cannot initialize: validateButton not found');
      return;
    }
    this.setupEventListeners();
    this.loadExamples();
  }

  setupEventListeners() {
    if (!this.validateButton) {
      console.error('Cannot setup event listeners: validateButton not found');
      return;
    }

    // Code explanation
    this.validateButton.addEventListener("click", () => this.explainCode());

    // Language tabs
    this.languageTabs.forEach((tab) => {
      tab.addEventListener("click", () =>
        this.switchLanguage(tab.dataset.language)
      );
    });
  }

  async explainCode() {
    const code = this.codeEditor.value.trim();
    if (!code) {
      this.showExplanationResult("Please enter some code to explain.", "info");
      return;
    }

    uiManager.setButtonLoading("validateButton", true, "Analyzing...");

    try {
      // Get AI-powered explanation
      const aiExplanation = await this.explainWithAI(
        code,
        this.currentLanguage
      );

      if (aiExplanation) {
        this.displayAIExplanation(aiExplanation);
      } else {
        // Fallback message
        this.showExplanationResult(
          "Unable to generate explanation. Please try again.",
          "error"
        );
      }

      // Track explanation for progress
      if (window.progressTracker) {
        window.progressTracker.incrementValidations(); // Reuse validation counter for now
      }
    } catch (error) {
      console.error("Explanation error:", error);
      uiManager.showError("Code explanation failed. Please try again.", () =>
        this.explainCode()
      );
      this.showExplanationResult(
        "Unable to explain code. Please check your connection and try again.",
        "error"
      );
    } finally {
      uiManager.setButtonLoading("validateButton", false);
    }
  }

  async explainWithAI(code, language) {
    try {
      // Add loading state
      this.showExplanationResult("Analyzing your code...", "loading");
      
      // Validate inputs
      if (!code || !language) {
        throw new Error("Code and language are required");
      }

      // Make API request with retry logic
      let retries = 3;
      let response;

      while (retries > 0) {
        try {
          response = await apiService.post("/api/groq", {
            code: code,
            language: language.toLowerCase(),
            task: "code-explanation",
            responseStyle: "normal"
          });
          
          if (response && (response.response || response.explanation)) {
            break; // Successful response
          }
          
          throw new Error("Invalid response format");
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      if (!response || (!response.response && !response.explanation)) {
        throw new Error("Failed to get explanation");
      }

      return response;
    } catch (error) {
      console.error("AI explanation error:", error);
      
      // Show user-friendly error message
      const errorMessage = error.message === "Failed to fetch" 
        ? "Connection error. Please check your internet connection and try again."
        : "Unable to explain the code at the moment. Please try again in a few moments.";
      
      this.showExplanationResult(errorMessage, "error");
      return null;
    }
  }

  displayAIExplanation(explanation) {
    let content = explanation.response || explanation.explanation || explanation;
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }

    let html = '<div class="ai-explanation-results">';
    
    // Add explanation header
    html += `
      <div class="explanation-header">
        <div class="explanation-title">
          <i class="fas fa-code"></i>
          <h3>Code Analysis</h3>
        </div>
        <div class="explanation-meta">
          <span class="language-badge ${this.currentLanguage}">
            ${this.currentLanguage.toUpperCase()}
          </span>
        </div>
      </div>
    `;

    // Main explanation content
    html += '<div class="explanation-content">';
    html += `<div class="explanation-text">${this.formatResponse(content)}</div>`;
    html += '</div>';

    // Add copy button for code examples
    html += `
      <div class="explanation-footer">
        <button class="btn btn-copy" onclick="navigator.clipboard.writeText(document.querySelector('.code-example').textContent)">
          <i class="fas fa-copy"></i> Copy Code Example
        </button>
      </div>
    `;

    html += '</div>';
    
    this.validationResults.innerHTML = html;

    // Highlight any code blocks in the explanation
    if (window.syntaxHighlighter) {
      const codeBlocks = this.validationResults.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        const language = block.className.replace('language-', '') || this.currentLanguage;
        window.syntaxHighlighter.highlightElement(block, language);
      });
    }
  }

  // Try to lazy-load the syntax checker script if it's not present.
  loadSyntaxChecker() {
    return new Promise((resolve, reject) => {
      if (typeof SyntaxChecker !== "undefined" && SyntaxChecker) {
        // already available
        this.syntaxChecker = new SyntaxChecker();
        return resolve(this.syntaxChecker);
      }

      // Prevent adding multiple script tags
      if (document.querySelector('script[data-syntax-checker="1"]')) {
        // wait until it's available
        const interval = setInterval(() => {
          if (typeof SyntaxChecker !== "undefined" && SyntaxChecker) {
            clearInterval(interval);
            this.syntaxChecker = new SyntaxChecker();
            resolve(this.syntaxChecker);
          }
        }, 50);
        // Timeout after a while
        setTimeout(() => {
          clearInterval(interval);
          if (this.syntaxChecker) return resolve(this.syntaxChecker);
          reject(new Error("syntax-checker load timeout"));
        }, 5000);
        return;
      }

      const script = document.createElement("script");
      script.src = "js/syntax-checker.js";
      script.setAttribute("data-syntax-checker", "1");
      script.onload = () => {
        if (typeof SyntaxChecker !== "undefined" && SyntaxChecker) {
          this.syntaxChecker = new SyntaxChecker();
          resolve(this.syntaxChecker);
        } else {
          reject(new Error("SyntaxChecker not available after load"));
        }
      };
      script.onerror = (e) =>
        reject(e || new Error("Failed to load syntax-checker.js"));
      document.head.appendChild(script);
    });
  }

  _runFallbackValidation(code) {
    // Fallback to basic syntax checking (assumes this.syntaxChecker exists)
    let result = { errors: [], warnings: [] };
    switch (this.currentLanguage) {
      case "html":
        result = this.syntaxChecker.checkHTML(code);
        break;
      case "css":
        result = this.syntaxChecker.checkCSS(code);
        break;
      case "javascript":
        result = this.syntaxChecker.checkJavaScript(code);
        break;
    }

    this.displayValidationResults(result);
  }

  fallbackValidation(code) {
    // If syntaxChecker is missing, try to load it lazily; otherwise run validation.
    if (!this.syntaxChecker) {
      this.loadSyntaxChecker()
        .then(() => {
          if (!this.syntaxChecker) {
            this.showExplanationResult(
              "Validation engine unavailable.",
              "error"
            );
            return;
          }
          this._runFallbackValidation(code);
        })
        .catch((err) => {
          console.warn("Could not load syntax checker:", err);
          this.showExplanationResult(
            "Validation unavailable. Please open the Code Explainer page to enable validation.",
            "error"
          );
        });
      return;
    }

    this._runFallbackValidation(code);
  }

  displayValidationResults(result) {
    let html = "";

    if (result.errors.length > 0) {
      html += '<div class="validation-errors">';
      html += "<h4>❌ Errors Found:</h4>";
      result.errors.forEach((error) => {
        html += `<div class="validation-item error">
          <strong>Line ${error.line}:</strong> ${error.message}
          ${
            error.suggestion
              ? `<br><em>Suggestion: ${error.suggestion}</em>`
              : ""
          }
        </div>`;
      });
      html += "</div>";
    }

    if (result.warnings.length > 0) {
      html += '<div class="validation-warnings">';
      html += "<h4>⚠️ Warnings:</h4>";
      result.warnings.forEach((warning) => {
        html += `<div class="validation-item warning">
          <strong>Line ${warning.line}:</strong> ${warning.message}
          ${
            warning.suggestion
              ? `<br><em>Suggestion: ${warning.suggestion}</em>`
              : ""
          }
        </div>`;
      });
      html += "</div>";
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      html =
        '<div class="validation-success">✅ Your code looks good! No errors or warnings found.</div>';
    }

    this.validationResults.innerHTML = html;
  }

  showExplanationResult(message, type = "info") {
    let icon = {
      info: '<i class="fas fa-info-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      loading: '<i class="fas fa-spinner fa-spin"></i>',
      success: '<i class="fas fa-check-circle"></i>'
    }[type];

    let html = `
      <div class="explanation-${type}">
        <div class="message-content">
          ${icon}
          <span>${message}</span>
        </div>
        ${type === 'error' ? `
          <div class="error-actions">
            <button class="btn btn-retry" onclick="aiValidator.explainCode()">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        ` : ''}
      </div>
    `;

    this.validationResults.innerHTML = html;

    // Auto-hide info messages after 5 seconds
    if (type === 'info') {
      setTimeout(() => {
        if (this.validationResults.querySelector('.explanation-info')) {
          this.validationResults.innerHTML = '';
        }
      }, 5000);
    }
  }

  formatResponse(text) {
    // Convert markdown-style code blocks to HTML
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || "text"}">${this.escapeHtml(
        code.trim()
      )}</code></pre>`;
    });

    // Convert inline code
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Convert line breaks to <br>
    text = text.replace(/\n/g, "<br>");

    return text;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  switchLanguage(language) {
    this.currentLanguage = language;

    // Update tabs
    this.languageTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.language === language);
    });

    // Remove existing syntax highlighting
    if (window.syntaxHighlighter) {
      window.syntaxHighlighter.removeHighlighting(this.codeEditor);
    }

    // Update placeholder
    const placeholders = {
      html: "Enter your HTML code here...\n\nExample:\n<h1>Hello World</h1>\n<p>This is a paragraph.</p>",
      css: "Enter your CSS code here...\n\nExample:\nbody {\n  font-family: Arial, sans-serif;\n  color: #333;\n}",
      javascript:
        'Enter your JavaScript code here...\n\nExample:\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));',
    };

    this.codeEditor.placeholder = placeholders[language];
    this.codeEditor.value = "";

    // Apply syntax highlighting if available
    if (window.syntaxHighlighter) {
      setTimeout(() => {
        window.syntaxHighlighter.applyHighlighting(this.codeEditor, language);
      }, 100);
    }

    this.validationResults.innerHTML = "";
  }

  loadExamples() {
    // Load knowledge base for examples
    fetch("data/ai-knowledge.json")
      .then((response) => response.json())
      .then((data) => {
        if (data.code_examples) {
          this.renderExamples(data.code_examples);
        }
      })
      .catch((error) => {
        console.error("Failed to load examples:", error);
      });
  }

  renderExamples(codeExamples) {
    let html = "";

    Object.keys(codeExamples).forEach((language) => {
      const examples = codeExamples[language];
      examples.forEach((example) => {
        html += `
          <div class="example-item" onclick="aiValidator.loadExample('${language}', '${example.title.replace(
          /'/g,
          "\\'"
        )}')">
            <h4>${example.title}</h4>
            <p>${example.description}</p>
            <span class="example-language">${language.toUpperCase()}</span>
          </div>
        `;
      });
    });

    this.examplesContent.innerHTML = html;
  }

  loadExample(language, title) {
    // Load knowledge base to find the example
    fetch("data/ai-knowledge.json")
      .then((response) => response.json())
      .then((data) => {
        const examples = data.code_examples[language];
        const example = examples.find((ex) => ex.title === title);

        if (example) {
          this.switchLanguage(language);
          this.codeEditor.value = example.code;

          // Re-apply syntax highlighting after setting value
          if (window.syntaxHighlighter) {
            setTimeout(() => {
              window.syntaxHighlighter.applyHighlighting(
                this.codeEditor,
                language
              );
            }, 100);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load example:", error);
      });
  }
}

// Initialize when DOM is loaded
let aiValidator;
aiValidator = new AIValidatorOnly();
