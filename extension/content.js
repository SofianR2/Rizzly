// Function to extract messages from different dating apps and services
function extractMessages() {
    const messages = [];
    const currentUrl = window.location.hostname;
  
    // Tinder extraction
    if (currentUrl.includes('tinder.com')) {
      const messageContainer = document.querySelector('[role="log"]');
      if (messageContainer) {
        const messageHelpers = messageContainer.querySelectorAll('div.msgHelper');
        messageHelpers.forEach(helper => {
          const timeElem = helper.querySelector('time');
          const timestamp = timeElem ? timeElem.getAttribute('datetime') : new Date().toISOString();
          const bubble = helper.querySelector('div.msg');
          if (bubble) {
            const textElem = bubble.querySelector('span.text');
            if (textElem) {
              const text = textElem.textContent.trim();
              // If the bubble's class includes "msg--received", it's from your match.
              const sender = bubble.className.includes('msg--received') ? 'match' : 'user';
              messages.push({ text, sender, timestamp });
            }
          }
        });
      }
    }
  
    // Bumble extraction
    if (currentUrl.includes('bumble.com')) {
      const messageContainer = document.querySelector('.messages-container');
      if (messageContainer) {
        const messageElements = messageContainer.querySelectorAll('.message');
        messageElements.forEach(msg => {
          // Assuming messages sent by the user have a class like "message--sent"
          const sender = msg.classList.contains('message--sent') ? 'user' : 'match';
          let text = '';
          const textElem = msg.querySelector('.message__text');
          if (textElem) {
            text = textElem.textContent.trim();
          } else {
            text = msg.textContent.trim();
          }
          let timestamp = new Date().toISOString();
          const timeElem = msg.querySelector('time');
          if (timeElem) {
            timestamp = timeElem.getAttribute('datetime') || timestamp;
          }
          messages.push({ text, sender, timestamp });
        });
      }
    }
  
    // Google Messages extraction (conversation list view)
    if (currentUrl.includes('messages.google.com')) {
      // In the provided HTML, each conversation appears as an <mws-conversation-list-item>
      const conversationItems = document.querySelectorAll('mws-conversation-list-item');
      conversationItems.forEach(item => {
        const snippetElem = item.querySelector('mws-conversation-snippet');
        if (snippetElem) {
          // For example, snippet text "Andy: Gonna be a bit late"
          const snippetText = snippetElem.textContent.trim();
          let sender = 'match';
          let text = snippetText;
          // If the text follows the format "Sender: Message", split it.
          if (snippetText.indexOf(':') !== -1) {
            const colonIndex = snippetText.indexOf(':');
            sender = snippetText.slice(0, colonIndex).trim();
            text = snippetText.slice(colonIndex + 1).trim();
          }
          // Optionally extract a timestamp from a relative timestamp element
          let timestamp = '';
          const timestampElem = item.querySelector('mws-relative-timestamp');
          if (timestampElem) {
            timestamp = timestampElem.textContent.trim();
          }
          messages.push({ text, sender, timestamp });
        }
      });
    }
  
    return messages;
  }
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getMessages') {
      const messages = extractMessages();
      sendResponse({ messages });
    }
    return true; // Required for async response
  });
  
  // Observe DOM changes to detect new messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        chrome.runtime.sendMessage({
          action: 'messagesUpdated',
          messages: extractMessages()
        });
      }
    });
  });
  
  // Start observing the chat container for changes
  function startObserving() {
    const currentUrl = window.location.hostname;
    let chatContainer;
  
    if (currentUrl.includes('tinder.com')) {
      chatContainer = document.querySelector('[role="log"]');
    } else if (currentUrl.includes('bumble.com')) {
      chatContainer = document.querySelector('.messages-container');
    } else if (currentUrl.includes('messages.google.com')) {
      // In this case, observe the main content area that holds the conversation list.
      chatContainer = document.querySelector('main.content-container');
    }
  
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Initialize observation when the page loads
  startObserving();
  