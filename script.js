const PRIVATE_API_KEY = "AIzaSyBJE6IqXU1oDBBhnvNbnrpHZIvwfrS08Ms";
let config = {
  aiAvatar: "death.png",
  theme: "light",
};

function loadConfig() {
  const savedConfig = localStorage.getItem("chatConfig");
  if (savedConfig) {
    const loadedConfig = JSON.parse(savedConfig);
    config.aiAvatar = loadedConfig.aiAvatar;
    config.theme = loadedConfig.theme;
    document.documentElement.setAttribute("data-theme", config.theme);
  }
}

function saveConfig() {
  localStorage.setItem(
    "chatConfig",
    JSON.stringify({
      aiAvatar: config.aiAvatar,
      theme: config.theme,
    })
  );
}

function newChat() {
  document.getElementById("chatContainer").innerHTML = "";
  addMessage("Hello! How can I help you today?", "ai");
}

function toggleTheme() {
  config.theme = config.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", config.theme);
  saveConfig();
}

function openSettings() {
  console.log("Settings opened");
}

function autoResize(textarea) {
  textarea.style.height = "auto";
  const maxHeight = 200;
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";

  if (scrollHeight > maxHeight) {
    textarea.style.overflowY = "auto";
  } else {
    textarea.style.overflowY = "hidden";
  }
}

function attachFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf,.doc,.docx";
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  input.click();
}

function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const fileMessage = `Attached file: ${file.name}`;
    addMessage(fileMessage, "user");
  };
  reader.readAsDataURL(file);
}

function addTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai typing-indicator";
  typingDiv.innerHTML = `
    <div class="avatar">
      <img src="${config.aiAvatar}" alt="AI Avatar" />
    </div>
    <div class="typing-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `;
  document.getElementById("chatContainer").appendChild(typingDiv);
  return typingDiv;
}

function removeTypingIndicator() {
  const typingIndicator = document.querySelector(".typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function addMessage(content, type) {
  const chatContainer = document.getElementById("chatContainer");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  // Process long strings if needed
  const processedContent = processMessageContent(content);

  messageDiv.innerHTML = `
<div class="avatar">
<img src="${type === "ai" ? config.aiAvatar : ".png"}" alt="${type} avatar" />
</div>
<div class="message-content">${processedContent}</div>
`;

  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Function to process message content
function processMessageContent(content) {
  // Handle code blocks
  if (content.includes("```")) {
    content = content.replace(
      /```([\s\S]*?)```/g,
      "<pre><code>$1</code></pre>"
    );
  }

  // Add invisible breaks to very long strings
  content = content.replace(/(\S{50})/g, "$1\u200B");

  return content;
}

// Improved textarea handling
function autoResize(textarea) {
  textarea.style.height = "auto";

  const maxHeight = window.innerHeight * 0.4;
  const scrollHeight = textarea.scrollHeight;

  textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
  textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";

  // Force layout recalculation to ensure proper scrolling
  requestAnimationFrame(() => {
    scrollToBottom(false);
  });
}

// Improved scroll handling with debounce
let scrollTimeout;
function scrollToBottom(smooth = true) {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    const chatContainer = document.getElementById("chatContainer");
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, 10);
}

// Handle keyboard events
function handleKeyboardEvent(e) {
  const textarea = e.target;

  // Allow Shift+Enter for new lines
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }

  // Prevent excessive input
  if (textarea.value.length > 10000) {
    // Adjust limit as needed
    e.preventDefault();
  }
}

// Initialize with enhanced features
function initializeApp() {
  loadConfig();

  const textarea = document.querySelector("textarea");
  textarea.addEventListener("keydown", handleKeyboardEvent);

  // Optimize for mobile
  if ("visualViewport" in window) {
    window.visualViewport.addEventListener("resize", () => {
      if (document.activeElement.tagName === "TEXTAREA") {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }
    });
  }

  addMessage("Hello! How can I help you today?", "ai");
  textarea.focus();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

async function sendMessage() {
  const textarea = document.querySelector("textarea");
  const message = textarea.value.trim();

  if (!message) return;

  textarea.value = "";
  textarea.style.height = "auto";
  autoResize(textarea);

  addMessage(message, "user");
  const typingIndicator = addTypingIndicator();

  try {
    const response = await getGeminiResponse(message);
    removeTypingIndicator();
    addMessage(response, "ai");
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    addMessage("Sorry, I encountered an error. Please try again.", "ai");
  }
}

async function getGeminiResponse(message) {
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  try {
    const response = await fetch(`${apiUrl}?key=${PRIVATE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      }),
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

// Event Listeners
document.querySelector("textarea").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.querySelector(".mobile-menu-btn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("active");
});

document.querySelector(".new-chat-btn").addEventListener("click", newChat);

// Handle clicks outside sidebar on mobile
document.addEventListener("click", (e) => {
  const sidebar = document.querySelector(".sidebar");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");

  if (
    sidebar.classList.contains("active") &&
    !sidebar.contains(e.target) &&
    !mobileMenuBtn.contains(e.target)
  ) {
    sidebar.classList.remove("active");
  }
});

// Initialize the app
function initializeApp() {
  loadConfig();
  addMessage("Hello! How can I help you today?", "ai");
  document.querySelector("textarea").focus();
}

// Start the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp);
function preventZoom() {
  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.scale !== 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// Tambahkan ke dalam initializeApp
function initializeApp() {
  loadConfig();
  addMessage("Hello! How can I help you today?", "ai");
  document.querySelector("textarea").focus();
  preventZoom();

  // Tambahan untuk handling virtual keyboard di iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.addEventListener("resize", () => {
      if (document.activeElement.tagName === "TEXTAREA") {
        window.setTimeout(() => {
          document.activeElement.scrollIntoView();
        }, 0);
      }
    });
  }
}

// Update fungsi autoResize
function autoResize(textarea) {
  textarea.style.height = "auto";
  const maxHeight = window.innerHeight * 0.4; // 40% dari tinggi viewport
  const scrollHeight = textarea.scrollHeight;
  textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";

  if (scrollHeight > maxHeight) {
    textarea.style.overflowY = "auto";
  } else {
    textarea.style.overflowY = "hidden";
  }

  // Scroll chat container ke bawah saat input membesar
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
// Enhanced message handling
function addMessage(content, type) {
  const chatContainer = document.getElementById("chatContainer");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  messageDiv.innerHTML = `
<div class="avatar">
<img src="${
    type === "ai" ? config.aiAvatar : "users.png"
  }" alt="${type} avatar" />
</div>
<div class="message-content">${content}</div>
`;

  chatContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Improved scroll handling
function scrollToBottom(smooth = true) {
  const chatContainer = document.getElementById("chatContainer");
  const scrollOptions = {
    top: chatContainer.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  };

  chatContainer.scrollTo(scrollOptions);
}

// Enhanced textarea auto-resize
function autoResize(textarea) {
  // Reset height to calculate proper scrollHeight
  textarea.style.height = "auto";

  // Calculate maximum height (40% of viewport height)
  const maxHeight = window.innerHeight * 0.4;
  const scrollHeight = textarea.scrollHeight;

  // Set new height
  textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";

  // Handle overflow
  textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";

  // Scroll chat to bottom when input grows
  scrollToBottom(false);
}

// Improved message sending
async function sendMessage() {
  const textarea = document.querySelector("textarea");
  const message = textarea.value.trim();

  if (!message) return;

  // Reset textarea
  textarea.value = "";
  textarea.style.height = "auto";
  autoResize(textarea);

  // Add message and scroll
  addMessage(message, "user");
  scrollToBottom();

  const typingIndicator = addTypingIndicator();

  try {
    const response = await getGeminiResponse(message);
    removeTypingIndicator();
    addMessage(response, "ai");
    scrollToBottom();
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    addMessage("Sorry, I encountered an error. Please try again.", "ai");
    scrollToBottom();
  }
}

// Handle keyboard visibility on mobile devices
function handleKeyboardVisibility() {
  const visualViewport = window.visualViewport;

  if (visualViewport) {
    visualViewport.addEventListener("resize", () => {
      const keyboardHeight = window.innerHeight - visualViewport.height;
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${keyboardHeight}px`
      );

      if (keyboardHeight > 0) {
        document.body.classList.add("keyboard-open");
      } else {
        document.body.classList.remove("keyboard-open");
      }

      scrollToBottom(false);
    });
  }
}

// Initialize app with enhanced features
function initializeApp() {
  loadConfig();
  handleKeyboardVisibility();
  addMessage("Hello! How can I help you today?", "ai");

  // Set up resize observer for chat container
  const resizeObserver = new ResizeObserver(() => {
    scrollToBottom(false);
  });

  const chatContainer = document.getElementById("chatContainer");
  resizeObserver.observe(chatContainer);

  // Focus textarea
  document.querySelector("textarea").focus();
}

// Add event listener for page visibility changes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    scrollToBottom(false);
  }
});

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
