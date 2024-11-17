// API Key Configuration
const PRIVATE_API_KEY = "AIzaSyBJE6IqXU1oDBBhnvNbnrpHZIvwfrS08Ms";

// Configuration and State Management
const config = {
  aiAvatar: "death.png",
  userAvatar: "users.png",
  theme: localStorage.getItem("theme") || "light",
  maxFileSize: 5 * 1024 * 1024, // 5MB
  typingTimeout: 1000,
  welcomeDelay: 1000
};

// State variables
let isConnected = navigator.onLine;
let isTyping = false;
let typingTimeout;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  applyTheme();
  setupEventListeners();
  addWelcomeMessage();
}

// Theme Management
function toggleTheme() {
  config.theme = config.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", config.theme);
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", config.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeIcon = document.querySelector(".theme-toggle i");
  if (themeIcon) {
    themeIcon.className = config.theme === "light" ? "fas fa-moon" : "fas fa-sun";
  }
}

// Connection Status Management
function updateConnectionStatus(connected) {
  isConnected = connected;
  
  if (!connected) {
    addMessage("Connection lost. Please check your internet connection.", "ai");
  }
}

// Message Handling
function addMessage(content, type) {
  const chatContainer = document.getElementById("chatContainer");
  const messageDiv = createMessageElement(content, type);
  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

function createMessageElement(content, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const avatarDiv = createAvatarElement(type);
  const contentDiv = createContentElement(content);

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  return messageDiv;
}

function createAvatarElement(type) {
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "avatar";
  
  const avatarImg = document.createElement("img");
  avatarImg.src = type === "ai" ? config.aiAvatar : config.userAvatar;
  avatarImg.alt = `${type === "ai" ? "AI" : "User"} Avatar`;
  avatarDiv.appendChild(avatarImg);

  return avatarDiv;
}

function createContentElement(content) {
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;
  return contentDiv;
}

// Typing Indicator
function addTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai typing-message";
  typingDiv.innerHTML = `
    <div class="avatar">
      <img src="${config.aiAvatar}" alt="AI Avatar" />
    </div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  document.getElementById("chatContainer").appendChild(typingDiv);
  scrollToBottom();
  return typingDiv;
}

function removeTypingIndicator() {
  const typingIndicator = document.querySelector(".typing-message");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Textarea Management
function autoResize(textarea) {
  textarea.style.height = "auto";
  const maxHeight = window.innerHeight < 600 ? 80 : 120;
  textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

// File Handling
function attachFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf,.doc,.docx";
  input.onchange = (e) => handleFileUpload(e.target.files[0]);
  input.click();
}

function handleFileUpload(file) {
  if (!file) return;
  
  if (file.size > config.maxFileSize) {
    addMessage("File size exceeds 5MB limit. Please choose a smaller file.", "ai");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => addMessage(`Attached file: ${file.name}`, "user");
  reader.onerror = () => addMessage("Error reading file. Please try again.", "ai");
  reader.readAsDataURL(file);
}

// Message Sending and API Integration
async function sendMessage() {
  const textarea = document.querySelector("textarea");
  const message = textarea.value.trim();

  if (!message || !isConnected) return;

  // Clear textarea and reset size
  textarea.value = "";
  textarea.style.height = "auto";
  autoResize(textarea);

  // Add user message and show typing indicator
  addMessage(message, "user");
  addTypingIndicator();

  try {
    const response = await getGeminiResponse(message);
    removeTypingIndicator();
    addMessage(response, "ai");
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    addMessage("Sorry, I encountered an error. Please try again.", "ai");
    updateConnectionStatus(false);
  }
}

async function getGeminiResponse(message) {
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  
  try {
    const response = await fetch(`${apiUrl}?key=${PRIVATE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Event Listeners Setup
function setupEventListeners() {
  const textarea = document.querySelector("textarea");
  
  // Textarea event listeners
  textarea.addEventListener("keydown", handleKeyPress);
  textarea.addEventListener("input", handleInput);

  // Network status listeners
  window.addEventListener("online", () => updateConnectionStatus(true));
  window.addEventListener("offline", () => updateConnectionStatus(false));
}

function handleKeyPress(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function handleInput() {
  autoResize(this);
  handleTypingState();
}

function handleTypingState() {
  if (!isTyping) {
    isTyping = true;
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
  }, config.typingTimeout);
}

// Utility Functions
function scrollToBottom() {
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addWelcomeMessage() {
  setTimeout(() => {
    addMessage("Hello! How can I help you today?", "ai");
  }, config.welcomeDelay);
}