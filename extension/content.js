// Function to extract messages from different dating apps
function extractMessages() {
    const messages = [];
    const currentUrl = window.location.hostname;

    if (currentUrl.includes('tinder.com')) {
        // Tinder message extraction
        const messageContainer = document.querySelector('[data-message-list]');
        if (messageContainer) {
            const messageElements = messageContainer.querySelectorAll('[data-message]');
            messageElements.forEach(msg => {
                const isOwn = msg.classList.contains('own');
                messages.push({
                    text: msg.textContent.trim(),
                    sender: isOwn ? 'user' : 'match',
                    timestamp: msg.getAttribute('data-time') || new Date().toISOString()
                });
            });
        }
    } else if (currentUrl.includes('bumble.com')) {
        // Bumble message extraction
        const messageElements = document.querySelectorAll('.message-wrapper');
        messageElements.forEach(msg => {
            const isOwn = msg.classList.contains('message--outgoing');
            messages.push({
                text: msg.querySelector('.message__text')?.textContent.trim(),
                sender: isOwn ? 'user' : 'match',
                timestamp: msg.querySelector('.message__time')?.textContent || new Date().toISOString()
            });
        });
    } else if (currentUrl.includes('hinge.co')) {
        // Hinge message extraction
        const messageElements = document.querySelectorAll('.message-item');
        messageElements.forEach(msg => {
            const isOwn = msg.classList.contains('sent');
            messages.push({
                text: msg.querySelector('.message-content')?.textContent.trim(),
                sender: isOwn ? 'user' : 'match',
                timestamp: msg.querySelector('.message-time')?.textContent || new Date().toISOString()
            });
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
            // Notify popup about new messages
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
        chatContainer = document.querySelector('[data-message-list]');
    } else if (currentUrl.includes('bumble.com')) {
        chatContainer = document.querySelector('.messages-container');
    } else if (currentUrl.includes('hinge.co')) {
        chatContainer = document.querySelector('.messages-list');
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