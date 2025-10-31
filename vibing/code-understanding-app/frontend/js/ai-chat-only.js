/**
 * AI Chat Only - Chat interface for Ask AI page
 * Handles only the chat functionality without code validation
 * Uses Groq AI for fast responses
 */
class AIChatOnly {
  constructor() {
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendButton = document.getElementById("sendButton");

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Chat functionality
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    this.addMessage("user", message);
    this.chatInput.value = "";

    // Show typing indicator
    this.showTypingIndicator();

    // Process message with Groq AI
    await this.processWithGroq(message);
  }

  addMessage(sender, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === "ai" ? "🤖" : "👤";
    const senderName = sender === "ai" ? "AI Assistant" : "You";

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-sender">${senderName}</div>
        <div class="message-text">${this.formatResponse(content)}</div>
      </div>
    `;

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "message ai-message typing-indicator";
    indicator.id = "typing-indicator";
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
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
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

  // Heuristic: determine whether the user's message is likely source code
  isCodeLike(text) {
    if (!text) return false;
    // Triple backticks explicitly indicate code blocks
    if (/```/.test(text)) return true;
    // If the message contains many newlines it's likely code
    if (text.split("\n").length > 4) return true;
    // Common code characters/keywords heuristics
    if (
      /[{}<>;\/=\*]/.test(text) &&
      /function|const|let|var|class|import|export/.test(text)
    )
      return true;
    return false;
  }

  // Extract code from a message. If fenced with ``` return inner code, otherwise return whole text.
  extractCode(text) {
    const fenceMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
    return text.trim();
  }

  async processWithGroq(message) {
    try {
      uiManager.setButtonLoading("sendButton", true, "Thinking...");

      // If message looks like code, call the code explanation path used by the explainer
      if (this.isCodeLike(message)) {
        const code = this.extractCode(message);
        // Try to detect a language from a code fence (```js) or basic heuristics
        let langMatch = message.match(/```(\w+)\n/);
        let language = langMatch ? langMatch[1].toLowerCase() : "javascript";

        const response = await apiService.post("/api/groq", {
          code: code,
          language: language,
        });

        uiManager.setButtonLoading("sendButton", false);
        this.hideTypingIndicator();

        const reply =
          response.response ||
          response.explanation ||
          response.choices?.[0]?.message?.content ||
          "Sorry, I couldn't generate a code explanation.";
        this.addMessage("ai", this.formatResponse(reply));
      } else {
        const response = await apiService.post("/api/groq", {
          messages: [{ role: "user", content: message }],
          model: "llama-3.1-8b-instant",
        });

        uiManager.setButtonLoading("sendButton", false);
        this.hideTypingIndicator();

        const reply =
          response.response ||
          response.choices?.[0]?.message?.content ||
          "Sorry, I couldn't generate a response.";
        this.addMessage("ai", this.formatResponse(reply));
      }

      // Track AI interaction for progress
      if (window.progressTracker) {
        window.progressTracker.incrementAIInteractions();
      }
    } catch (error) {
      uiManager.setButtonLoading("sendButton", false);
      this.hideTypingIndicator();
      console.error("Groq API error:", error);

      // Enhanced error handling with fallback suggestions
      let userMessage = CONFIG.MESSAGES.AI_UNAVAILABLE;

      if (
        error.message.includes("API key") ||
        error.message.includes("API_KEY")
      ) {
        userMessage = `❌ Groq API key is not configured. Please add GROQ_API_KEY to the backend .env file.`;
      } else if (
        error.message.includes("timeout") ||
        error.message.includes("network")
      ) {
        userMessage = `❌ Network error. ${CONFIG.MESSAGES.NETWORK_ERROR}`;
      }

      this.addMessage("ai", userMessage);
      uiManager.showError(userMessage, () => this.processWithGroq(message));
    }
  }
}

// Initialize when DOM is loaded
let aiChatOnly;
document.addEventListener("DOMContentLoaded", () => {
  aiChatOnly = new AIChatOnly();
});
