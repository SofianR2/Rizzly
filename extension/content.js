// Function to extract messages from different dating apps
function extractMessages() {
    const messages = [];
    const currentUrl = window.location.hostname;

    if (currentUrl.includes('tinder.com')) {
        // Tinder message extraction using updated selectors
        const messageContainer = document.querySelector('[role="log"]');
        if (messageContainer) {
            // Find all helper elements that contain a timestamp and a message bubble
            const messageHelpers = messageContainer.querySelectorAll('div.msgHelper');
            messageHelpers.forEach(helper => {
                // Get the timestamp from the <time> element (if available)
                const timeElem = helper.querySelector('time');
                const timestamp = timeElem ? timeElem.getAttribute('datetime') : new Date().toISOString();

                // Get the message bubble containing the text
                const bubble = helper.querySelector('div.msg');
                if (bubble) {
                    const textElem = bubble.querySelector('span.text');
                    if (textElem) {
                        const text = textElem.textContent.trim();
                        // Use class names to decide who sent the message:
                        // If the bubble contains "msg--received", assume it's from the match; otherwise, it's from the user.
                        const sender = bubble.className.includes('msg--received') ? 'match' : 'user';
                        messages.push({ text, sender, timestamp });
                    }
                }
            });
        }
    } 

    // You can add extraction logic for other dating apps here

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
        // Use the updated selector for Tinder
        chatContainer = document.querySelector('[role="log"]');
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
