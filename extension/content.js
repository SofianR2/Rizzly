// Function to extract messages from different dating apps and services
function extractMessages() {
    const messages = [];
    const currentUrl = window.location.hostname;

    // Discord extraction
    if (currentUrl.includes('discord.com')) {
      const messageElements = document.querySelectorAll('.messageListItem__5126c');
      messageElements.forEach(msg => {
        const contentElement = msg.querySelector('.markup__75297.messageContent_c19a55');
        const usernameElement = msg.querySelector('.username_c19a55');
        const timestampElement = msg.querySelector('time');
        
        if (contentElement && usernameElement) {
          const text = contentElement.textContent.trim();
          const username = usernameElement.textContent.trim();
          const timestamp = timestampElement ? timestampElement.getAttribute('datetime') : new Date().toISOString();
          
          // Get the currently logged-in user's username for comparison
          const currentUsername = document.querySelector('.username_c19a55')?.textContent.trim();
          const isCurrentUser = username === 'jason-zhxn'; // This matches your username from the HTML
          
          messages.push({
            text,
            sender: isCurrentUser ? 'user' : 'match',
            timestamp
          });
        }
      });
    }

    // Bumble extraction
    if (currentUrl.includes('bumble.com')) {
      const messageContainer = document.querySelector('.messages-list__conversation');
      if (messageContainer) {
        const messageElements = messageContainer.querySelectorAll('.message');
        messageElements.forEach(msg => {
          // Messages with class 'message--out' are sent by the user
          const isOutgoing = msg.classList.contains('message--out');
          const textElement = msg.querySelector('.message-bubble__text');
          if (textElement) {
            const text = textElement.textContent.trim();
            messages.push({
              text: text,
              sender: isOutgoing ? 'user' : 'match',
              timestamp: new Date().toISOString() // Bumble doesn't show message timestamps in the HTML
            });
          }
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
  
  // Start observing the chat container
  function startObserving() {
    const currentUrl = window.location.hostname;
    let chatContainer;
  
    if (currentUrl.includes('tinder.com')) {
      chatContainer = document.querySelector('[role="log"]');
    } else if (currentUrl.includes('bumble.com')) {
      chatContainer = document.querySelector('.messages-list__conversation');
    } else if (currentUrl.includes('messages.google.com')) {
      chatContainer = document.querySelector('main.content-container');
    } else if (currentUrl.includes('discord.com')) {
      chatContainer = document.querySelector('.scrollerContent__36d07');
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
  