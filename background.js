chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "explainWithAI",
      title: "Explain with AI",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "explainWithAI" && info.selectionText) {
      chrome.storage.local.set({ selectedText: info.selectionText }, () => {
        console.log("Stored selected text:", info.selectionText);
      });
    }
  });
  