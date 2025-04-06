chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_SELECTION_AND_CONTEXT") {
      const selectedText = window.getSelection().toString();
      const pageContext = document.body.innerText;
  
      sendResponse({
        selectedText,
        pageContext
      });
  
      return true; // keep message channel alive for async
    }
  });
  