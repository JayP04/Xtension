// content.js -- with running AI insertions and floating box creation.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "INJECT_FINAL_ANSWER") {
      const answer = request.answer;
  
      const active = document.activeElement;
      if (
        active && (active.tagName === "TEXTAREA" || (active.tagName === "INPUT" && active.type === "text"))
      ) {
        active.value += "\n" + answer;
        active.focus();
        return;
      }
  
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const anchorElement = anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode;
  
      const anchorBox = anchorElement?.getBoundingClientRect();
      const inputs = Array.from(document.querySelectorAll("textarea, input[type='text']"));
  
      let closestInput = null;
      let minDistance = Infinity;
  
      if (anchorBox && inputs.length > 0) {
        inputs.forEach(input => {
          const box = input.getBoundingClientRect();
          const distance = box.top - anchorBox.top;
          if (distance >= 0 && distance < minDistance) {
            closestInput = input;
            minDistance = distance;
          }
        });
      }
  
      if (closestInput) {
        closestInput.value += "\n" + answer;
        closestInput.focus();
        return;
      }
  
      const editable = anchorElement?.closest('[contenteditable="true"]');
      if (editable) {
        const answerBox = document.createElement("div");
        answerBox.innerText = answer;
        answerBox.style.padding = "8px";
        answerBox.style.marginTop = "10px";
        answerBox.style.backgroundColor = "#f0f0f0";
        answerBox.style.border = "1px solid #ccc";
        answerBox.style.borderRadius = "6px";
        answerBox.style.fontFamily = "monospace";
        editable.appendChild(answerBox);
        return;
      }
  
      const floatBox = document.createElement("div");
      floatBox.style.position = "fixed";
      floatBox.style.bottom = "20px";
      floatBox.style.right = "20px";
      floatBox.style.width = "300px";
      floatBox.style.padding = "16px";
      floatBox.style.backgroundColor = "#ffffff";
      floatBox.style.border = "1px solid #ccc";
      floatBox.style.borderRadius = "10px";
      floatBox.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      floatBox.style.zIndex = 9999;
      floatBox.style.fontFamily = "Segoe UI, sans-serif";
  
      const answerContent = document.createElement("div");
      answerContent.innerText = answer;
      floatBox.appendChild(answerContent);
  
      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copy";
      copyBtn.style.marginTop = "10px";
      copyBtn.style.padding = "6px 10px";
      copyBtn.style.backgroundColor = "#2563eb";
      copyBtn.style.color = "white";
      copyBtn.style.border = "none";
      copyBtn.style.borderRadius = "4px";
      copyBtn.style.cursor = "pointer";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(answer);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
          if (document.body.contains(floatBox)) {
            document.body.removeChild(floatBox);
          }
        }, 500);
      };
  
      floatBox.appendChild(document.createElement("hr"));
      floatBox.appendChild(copyBtn);
      document.body.appendChild(floatBox);
    }
  });
  