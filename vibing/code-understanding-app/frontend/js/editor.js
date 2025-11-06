// Wait for DOM and dependencies to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Try to reference globals but continue even if they're absent.
  if (!window.CONFIG) {
    console.warn("CONFIG object not found — using defaults");
    window.CONFIG = window.CONFIG || {};
  }

  // uiManager and apiService are optional for the editor; detect their presence
  const hasUIManager = !!window.uiManager;
  const hasAPIService = !!window.apiService;

  // Get DOM elements
  const codeEl = document.getElementById("code");
  const frame = document.getElementById("output");

  // Debug: confirm script executed and DOM elements were found (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      console.debug(
        "editor.js loaded — codeEl=",
        !!codeEl,
        "frame=",
        !!frame,
        "hasUIManager=",
        hasUIManager,
        "hasAPIService=",
        hasAPIService
      );
    } catch (e) {}
  }

  // Check if required elements exist
  if (!codeEl || !frame) {
    console.error("Required elements not found in the DOM");
    return;
  }

  // Run state
  let isRunning = false;
  let autoRunEnabled = false;
  let autoRunTimeout = null;
  let lastRunTime = 0;
  const RUN_THROTTLE_MS = 500; // Prevent rapid successive runs

  // Default starter code
  const defaultCode = `<!DOCTYPE html>
    <html>
    <head>
        <title>My Web Page</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                color: #2c3e50;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to the Code Editor</h1>
            <p>Start coding here!</p>
        </div>
    </body>
    </html>`;

  // Manual run function
  function runCode() {
    if (isRunning) return;

    // Throttle rapid successive runs
    const now = Date.now();
    if (now - lastRunTime < RUN_THROTTLE_MS) return;
    lastRunTime = now;

    isRunning = true;

    try {
      frame.classList.add("loading");
      const code = codeEl.value;

      // Create a sandbox iframe with necessary permissions
      frame.sandbox =
        "allow-scripts allow-same-origin allow-forms allow-popups";

      // Set default content security policies for the iframe
      const securityHeaders = `
        <meta http-equiv="Content-Security-Policy" 
              content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;
                      style-src 'self' 'unsafe-inline' https:;
                      img-src 'self' data: https:;
                      connect-src 'self' http: https:;">`;

      // Sanitize user code to prevent XSS
      const sanitizedCode = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<!-- Script removed for security -->')
                                .replace(/javascript:/gi, '#')
                                .replace(/on\w+\s*=/gi, 'data-disabled=');

      // Wrap user code with error handling
      const wrappedCode = `
        <!DOCTYPE html>
        <html>
          <head>
            ${securityHeaders}
            <base target="_blank">
            <style>
              /* Default styles for preview */
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                line-height: 1.6;
              }
              /* Error display styling */
              .error-display {
                background: #fee;
                color: #e74c3c;
                padding: 10px;
                border-radius: 4px;
                border-left: 4px solid #e74c3c;
                margin: 10px 0;
                font-family: monospace;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <script>
              window.onerror = function(msg, url, line, col, error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-display';
                errorDiv.textContent = \`Error: \${msg}\\nLine: \${line}\\nColumn: \${col}\`;
                document.body.insertBefore(errorDiv, document.body.firstChild);
                return false;
              };
            </script>
            ${sanitizedCode}
          </body>
        </html>
      `;

      // Create a blob URL for the HTML content
      const blob = new Blob([wrappedCode], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Set the iframe src to the blob URL
      frame.src = url;

      // Clean up the blob URL after the iframe loads
      frame.onload = () => {
        URL.revokeObjectURL(url);
        frame.classList.remove("loading");
        isRunning = false;
        if (runTimeout) clearTimeout(runTimeout);
      };

      // Handle load errors with better error handling
      frame.onerror = (error) => {
        console.error("Error loading preview:", error);
        frame.classList.remove("loading");
        frame.srcdoc = `
          <html><body style="margin:0;padding:20px;font-family:sans-serif;">
            <div style="background:#fee;color:#e74c3c;padding:15px;border-radius:4px;border-left:4px solid #e74c3c;">
              <h3 style="margin:0 0 10px 0">Error loading preview</h3>
              <p style="margin:0">Please check your code for errors.</p>
              ${
                error
                  ? `<pre style="margin:10px 0 0 0;font-size:14px">${error.toString()}</pre>`
                  : ""
              }
            </div>
          </body></html>
        `;
        isRunning = false;
      };

      // Add timeout for long-running code
      const runTimeout = setTimeout(() => {
        if (isRunning) {
          console.warn("Code execution timed out");
          frame.classList.remove("loading");
          frame.srcdoc = `
            <html><body style="margin:0;padding:20px;font-family:sans-serif;">
              <div style="background:#fff3cd;color:#856404;padding:15px;border-radius:4px;border-left:4px solid #856404;">
                <h3 style="margin:0 0 10px 0">Execution Timeout</h3>
                <p style="margin:0">Your code took too long to execute. This might be due to an infinite loop or heavy computation.</p>
              </div>
            </body></html>
          `;
          isRunning = false;
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error running code:", error);
      frame.classList.remove("loading");
      if (runTimeout) clearTimeout(runTimeout);
      frame.srcdoc = `
        <html><body style="margin:0;padding:20px;font-family:sans-serif;">
          <div style="background:#fee;color:#e74c3c;padding:15px;border-radius:4px;border-left:4px solid #e74c3c;">
            <h3 style="margin:0 0 10px 0">Error running code</h3>
            <p style="margin:0 0 10px 0">There was a problem executing your code. Please check for syntax errors.</p>
            <pre style="margin:0;font-size:14px">${error.toString()}</pre>
          </div>
        </body></html>
      `;
      isRunning = false;
    }
  }

  // Clear function
  function clearCode() {
    codeEl.value = "";
    frame.srcdoc = "";
  }

  // Save code function
  function saveCode() {
    const code = codeEl.value;
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Auto-run functionality
  function toggleAutoRun() {
    autoRunEnabled = !autoRunEnabled;
    const toggleBtn = document.getElementById("autoRunToggle");

    if (toggleBtn) {
      autoRunEnabled = !autoRunEnabled;
      toggleBtn.classList.toggle("active", autoRunEnabled);
      const icon = toggleBtn.querySelector("i");
      
      // Update button text
      const textNode = Array.from(toggleBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
      if (textNode) {
        textNode.textContent = autoRunEnabled ? " Auto Run: ON" : " Auto Run: OFF";
      } else {
        // Fallback if no text node is found
        const span = document.createElement('span');
        span.textContent = autoRunEnabled ? " Auto Run: ON" : " Auto Run: OFF";
        toggleBtn.appendChild(span);
      }

      // Update icon
      if (icon) {
        if (autoRunEnabled) {
          icon.className = "fas fa-sync-alt fa-spin";
          // Run immediately when enabled
          runCode();
        } else {
          icon.className = "fas fa-sync-alt";
          // Clear any pending auto-run
          if (autoRunTimeout) {
            clearTimeout(autoRunTimeout);
            autoRunTimeout = null;
          }
        }
      }
    }
  }

  function scheduleAutoRun() {
    if (autoRunEnabled && autoRunTimeout) {
      clearTimeout(autoRunTimeout);
    }

    if (autoRunEnabled) {
      autoRunTimeout = setTimeout(() => {
        runCode();
      }, 1000); // 1 second delay after typing stops
    }
  }

  // Event listeners
  const runBtn = document.getElementById("run");
  const clearBtn = document.getElementById("clear");
  const saveBtn = document.getElementById("save");
  const autoRunToggleBtn = document.getElementById("autoRunToggle");

  if (runBtn) runBtn.addEventListener("click", runCode);
  if (clearBtn) clearBtn.addEventListener("click", clearCode);
  if (saveBtn) saveBtn.addEventListener("click", saveCode);
  if (autoRunToggleBtn) autoRunToggleBtn.addEventListener("click", toggleAutoRun);

  // Add input event listener for auto-run
  if (codeEl) {
    codeEl.addEventListener("input", scheduleAutoRun);
  }

  // Load lesson from URL parameters or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get("lesson") || localStorage.getItem("lesson");

  if (lessonId) {
    if (hasUIManager) {
      try {
        uiManager.showLoading("code", "Loading lesson...");
      } catch (e) {
        console.warn("uiManager.showLoading failed", e);
      }
    }

    if (hasAPIService) {
      apiService
        .get(`/api/lessons/${lessonId}`)
        .then((lesson) => {
          if (hasUIManager) {
            try {
              uiManager.hideLoading("code");
            } catch (e) {}
          }
          codeEl.value =
            lesson && lesson.exercise && lesson.exercise.starter
              ? lesson.exercise.starter
              : defaultCode;
          // Only log in development
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
              console.debug(
                "editor.js: set code from lesson or default — length=",
                codeEl.value ? codeEl.value.length : 0
              );
            } catch (e) {}
          }
          if (hasUIManager) {
            try {
              uiManager.showSuccess("Lesson loaded successfully!");
            } catch (e) {}
          }
        })
        .catch((error) => {
          if (hasUIManager) {
            try {
              uiManager.hideLoading("code");
            } catch (e) {}
          }
          console.error("Error loading lesson:", error);
          if (
            hasUIManager &&
            CONFIG &&
            CONFIG.MESSAGES &&
            CONFIG.MESSAGES.LESSON_LOAD_ERROR
          ) {
            try {
              uiManager.showError(CONFIG.MESSAGES.LESSON_LOAD_ERROR);
            } catch (e) {}
          }
          // Load default code if lesson fails to load
          codeEl.value = defaultCode;
          // Only log in development
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
              console.debug("editor.js: lesson load failed — default code set");
            } catch (e) {}
          }
        });
    } else {
      // apiService not available — fall back to default code
      console.warn("apiService not available; loading default starter code");
      if (hasUIManager) {
        try {
          uiManager.hideLoading("code");
        } catch (e) {}
      }
      codeEl.value = defaultCode;
      try {
        console.debug("editor.js: apiService missing — default code set");
      } catch (e) {}
    }
  } else {
    // Load default code if no lesson
    codeEl.value = defaultCode;
    // Only log in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        console.debug("editor.js: no lessonId — default code set");
      } catch (e) {}
    }
  }

  // Run initial code after a short delay (only if auto-run is not enabled)
  if (!autoRunEnabled) {
    setTimeout(runCode, 100);
  }
}); // Close the DOMContentLoaded event listener
