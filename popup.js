// popup.js

const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY; // Use the API key from the config file
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let chatHistory = []; // maintain message history
let firstInteraction = true;
let conceptualMode = true; // default mode

// Utility to add a message to the chat UI
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender;

  if (sender === "ai") {
    msg.innerHTML = marked.parse(text.trim());
  } else {
    msg.innerText = text;
  }

  const chatLog = document.getElementById("chat-log");
  chatLog.appendChild(msg);
    // Scroll to the bottom of the chat log
    setTimeout(() => {
      chatLog.scrollTop = chatLog.scrollHeight;
    },100);
}

// Build enhanced prompt with contextual metadata
function buildPrompt(selectedText, contextExtras = {}) {
  const { label, section, placeholder, title } = contextExtras;

  const contextBlock = `
${label ? `- Label: ${label}` : ""}
${section ? `- Section: ${section}` : ""}
${title ? `- Page Title: ${title}` : ""}
${placeholder ? `- Input Placeholder: ${placeholder}` : ""}`.trim();

  if (conceptualMode) {
    return `You are a helpful AI tutor. A student selected the problem below while working on a webpage.
Below is the problem followed by extracted page context. Focus on the thought process, not the answer.

Problem:
"${selectedText}"

Context:
${contextBlock}`;
  } else {
    return `A student is requesting a direct answer for the following problem from a webpage.
Below is the selected problem and some context from the page:

Problem:
"${selectedText}"

Context:
${contextBlock}

Please provide the most accurate and complete answer.`;
  }
}

// Call Gemini API with message history
async function callGemini(newUserMessage, isReveal = false, isSystemPrompt = false) {
  if (!isSystemPrompt) {
    appendMessage("user", newUserMessage);
  }

  chatHistory.push({
    role: "user",
    parts: [{ text: newUserMessage }]
  });

  appendMessage("ai", "Thinking...");

  const body = { contents: chatHistory };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";

    document.getElementById("chat-log").lastChild.innerHTML = marked.parse(reply.trim());

    chatHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });

    const revealBtn = document.getElementById("reveal-btn");
    if (conceptualMode && !isReveal) {
      revealBtn.style.display = "block";
    } else {
      revealBtn.style.display = "none";

      // Send message to content script to inject final answer
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "INJECT_FINAL_ANSWER",
          answer: reply
        });
      });
    }
  } catch (err) {
    console.error("Gemini API error:", err);
    document.getElementById("chat-log").lastChild.innerText = "[Error contacting Gemini API]";
  }
}

// Load initial selected text and build full prompt
function getPageContextAndStart(selectedText) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const selection = window.getSelection();
        const anchor = selection?.anchorNode?.parentElement;

        const label = anchor?.closest('label, .question, h2')?.textContent?.trim() ?? "";
        const section = document.querySelector('h1, .section-title')?.textContent?.trim() ?? "";
        const placeholder = document.querySelector('textarea, input')?.placeholder ?? "";
        const title = document.title;

        return { label, section, placeholder, title };
      }
    }, (results) => {
      const context = results[0]?.result ?? {};
      const prompt = buildPrompt(selectedText, context);
      callGemini(prompt, false, true); // ✅ system prompt = true
    });
  });
}

// Init popup UI
document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const inputField = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-btn");
  const toggleSwitch = document.getElementById("mode-toggle");
  const modeLabel = document.getElementById("mode-label");
  const revealBtn = document.getElementById("reveal-btn");

  function updateModeUI() {
    if (conceptualMode) {
      modeLabel.textContent = "Conceptual Mode";
      modeLabel.style.color = "#3cb371"; // green
    } else {
      modeLabel.textContent = "Direct Answer Mode";
      modeLabel.style.color = "#e63946"; // red
    }
  }

  function handleUserInput() {
    const userInput = inputField.value.trim();
    if (!userInput) return;
    inputField.value = "";
    callGemini(userInput);
  }

  sendButton.addEventListener("click", handleUserInput);
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserInput();
    }
  });

  revealBtn.addEventListener("click", () => {
    revealBtn.style.display = "none";
    callGemini("Now please give the full answer to the original question.", true);
  });

  toggleSwitch.addEventListener("change", () => {
    conceptualMode = toggleSwitch.checked;
    updateModeUI();
    revealBtn.style.display = "none";
  });

  updateModeUI();

  chrome.storage.local.get("selectedText", (data) => {
    const selectedText = data.selectedText;
    if (selectedText && firstInteraction) {
      firstInteraction = false;
      getPageContextAndStart(selectedText); // enhanced prompt logic
    }
  });
});
