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
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Call Gemini API with message history
async function callGemini(newUserMessage, isReveal = false) {
  appendMessage("user", newUserMessage);

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
    }
  } catch (err) {
    console.error("Gemini API error:", err);
    document.getElementById("chat-log").lastChild.innerText = "[Error contacting Gemini API]";
  }
}

// Load initial selected text (for one-time message)
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

      const introPrompt = conceptualMode
        ? `You are a helpful AI tutor. Please conceptually explain the following problem in plain English.
          Avoid giving full answers, just guide the thinking process.
          Problem: "${selectedText}"`
        : `Please provide the full answer to the following question:
          "${selectedText}"`;

      callGemini(introPrompt);
    }
  });
});


// // popup.js

// const GEMINI_API_KEY = "AIzaSyCnBKmVnsRK2sVgpJgx6rL8W5gSnD3CDbA";
// const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// const chatLog = document.getElementById("chat-log");
// const inputField = document.getElementById("chat-input");
// const sendButton = document.getElementById("send-btn");

// let chatHistory = []; // maintain message history
// let firstInteraction = true;

// // Utility to add a message to the chat UI
// function appendMessage(sender, text) {
//   const msg = document.createElement("div");
//   msg.className = sender;

//   if (sender === "ai") {
//     msg.innerHTML = marked.parse(text.trim());
//   } else {
//     msg.innerText = text;
//   }

//   chatLog.appendChild(msg);
//   chatLog.scrollTop = chatLog.scrollHeight;
// }

// // Call Gemini API with message history
// async function callGemini(newUserMessage) {
//   appendMessage("user", newUserMessage);

//   chatHistory.push({
//     role: "user",
//     parts: [{ text: newUserMessage }]
//   });

//   appendMessage("ai", "Thinking...");

//   const body = { contents: chatHistory };

//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body)
//     });

//     const data = await res.json();
//     const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";

//     chatLog.lastChild.innerHTML = marked.parse(reply.trim());

//     chatHistory.push({
//       role: "model",
//       parts: [{ text: reply }]
//     });
//   } catch (err) {
//     console.error("Gemini API error:", err);
//     chatLog.lastChild.innerText = "[Error contacting Gemini API]";
//   }
// }

// // Handle input
// function handleUserInput() {
//   const userInput = inputField.value.trim();
//   if (!userInput) return;
//   inputField.value = "";
//   callGemini(userInput);
// }

// sendButton.addEventListener("click", handleUserInput);
// inputField.addEventListener("keydown", (e) => {
//   if (e.key === "Enter") {
//     handleUserInput();
//   }
// });

// // Load initial selected text (for one-time message)
// document.addEventListener("DOMContentLoaded", () => {
//   chrome.storage.local.get("selectedText", (data) => {
//     const selectedText = data.selectedText;
//     if (selectedText && firstInteraction) {
//       firstInteraction = false;

//       const introPrompt = `
// You are a helpful AI tutor. Only provide conceptual explanations — no code or markdown yet. Just use plain language to help the user approach this problem. Answers only to be
// given if the user asks for it.

// Problem: "${selectedText}"`;

//       callGemini(introPrompt);
//     }
//   });
// });
