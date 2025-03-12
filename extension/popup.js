// DOM Elements
const chatPreview = document.getElementById('chatPreview');
const suggestionsDiv = document.getElementById('suggestions');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const generateBtn = document.getElementById('generateBtn');

// OpenAI API configuration
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = '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';

// Format messages for display
function formatMessages(messages) {
    return messages.map(msg => {
        const messageClass = msg.sender === 'user' ? 'user-message' : 'match-message';
        return `<div class="${messageClass}">${msg.text}</div>`;
    }).join('');
}

// Add context input field styles
const style = document.createElement('style');
style.textContent = `
    body {
        margin: 0;
        padding: 10px;
        min-width: 300px;
    }
    .suggestion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background-color: white;
    }
    .suggestion-text {
        flex-grow: 1;
        margin-right: 10px;
    }
    .copy-button {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .copy-button:hover {
        background-color: #1976D2;
    }
    .user-message {
        background-color: #e3f2fd;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 15px;
        max-width: 80%;
        margin-left: auto;
        text-align: right;
    }
    .match-message {
        background-color: #f5f5f5;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 15px;
        max-width: 80%;
        margin-right: auto;
        text-align: left;
    }
    #chatPreview {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        min-height: 50px;
        background-color: white;
        border-radius: 4px;
    }
    #suggestionsDiv {
        margin-top: 10px;
    }
    .context-container {
        margin: 10px 0;
        padding: 10px;
        border-radius: 4px;
        background-color: #f8f9fa;
    }
    .context-label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
    }
    .context-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        resize: vertical;
        min-height: 60px;
        box-sizing: border-box;
    }
    .context-input::placeholder {
        color: #999;
    }
    #loadingDiv {
        text-align: center;
        padding: 10px;
    }
    #errorDiv {
        color: #d32f2f;
        padding: 10px;
        margin: 5px 0;
        border-radius: 4px;
        background-color: #ffebee;
        display: none;
    }
`;
document.head.appendChild(style);

// Add context input HTML after chat preview
chatPreview.insertAdjacentHTML('afterend', `
    <div class="context-container">
        <label class="context-label" for="contextInput">Tell me more about the other person:</label>
        <textarea 
            id="contextInput" 
            class="context-input" 
            placeholder="Add any relevant details about the person (their interests, job, vibe, etc.)"
        ></textarea>
    </div>
`);

const contextInput = document.getElementById('contextInput');

// Format messages for OpenAI
function formatPrompt(messages) {
    const conversation = messages.map(msg => 
        `${msg.sender === 'user' ? 'You' : 'Them'}: ${msg.text}`
    ).join('\n');
    
    const context = contextInput.value.trim();
    const contextInfo = context ? `\nContext about them: ${context}` : '';

    return `You're a modern dating coach helping craft messages for dating apps. Generate 3 engaging responses that are playful, confident, and authentic. 
    Use modern texting style (casual, sometimes using lowercase, emojis where natural).
    Follow these guidelines:
    - MAKE IT AS HUMAN AS POSSIBLE, SO NOT TOO LONG OR CRINGE
    - Keep it concise and punchy
    - Show personality and humor, but don't overuse emojis
    - Create intrigue and emotional spikes
    - Match their energy level
    - Use statements more than questions
    - Reference details from their messages or profile
    ${contextInfo}

Here's the conversation:
${conversation}

Generate 3 different responses that are flirty and engaging. Each should have a different approach/vibe. Make them natural and authentic, avoiding anything creepy or overly aggressive. Format each response on its own line.`;
}

// Generate suggestions using OpenAI
async function generateSuggestions(messages) {
    try {
        const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'user',
                        content: formatPrompt(messages)
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to generate suggestions');
        }

        const data = await response.json();
        return data.choices[0].message.content
            .split('\n')
            .filter(s => s.trim())
            .map(s => s.replace(/^\d+\.\s*/, '')) // Remove leading numbers and dots
            .map(s => s.replace(/^["']|["']$/g, '').trim()); // Remove surrounding quotes
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Failed to generate suggestions: ' + error.message);
    }
}

// Display suggestions in the popup
function displaySuggestions(suggestions) {
    suggestionsDiv.innerHTML = suggestions.map((suggestion, index) => 
        `<div class="suggestion">
            <div class="suggestion-text">${suggestion}</div>
            <button class="copy-button" data-suggestion="${encodeURIComponent(suggestion.trim())}">
                Copy
            </button>
        </div>`
    ).join('');

    // Add click handlers for copy buttons
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', async () => {
            const text = decodeURIComponent(button.dataset.suggestion).replace(/^["']|["']$/g, '').trim();
            try {
                await navigator.clipboard.writeText(text);
                
                // Visual feedback
                const originalText = button.textContent;
                button.textContent = '✓ Copied!';
                button.style.backgroundColor = '#4CAF50';
                
                // Reset button after 1.5 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '#2196F3';
                }, 1500);
            } catch (err) {
                // Fallback to older method
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    
                    // Visual feedback
                    const originalText = button.textContent;
                    button.textContent = '✓ Copied!';
                    button.style.backgroundColor = '#4CAF50';
                    
                    // Reset button after 1.5 seconds
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '#2196F3';
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy text:', err);
                    showError('Failed to copy text to clipboard');
                }
                
                document.body.removeChild(textarea);
            }
        });
    });
}

// Show error message
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Check if we're on a supported platform
async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const supportedDomains = ['tinder.com', 'bumble.com', 'hinge.co', 'discord.com'];
    return supportedDomains.some(domain => url.includes(domain));
}

// Inject content script manually if needed
async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
        return true;
    } catch (error) {
        console.error('Failed to inject content script:', error);
        return false;
    }
}

// Handle generate button click
generateBtn.addEventListener('click', async () => {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    
    // Store the old suggestions HTML
    const oldSuggestions = suggestionsDiv.innerHTML;

    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if we're on a supported site
        const isSupported = await checkCurrentTab();
        if (!isSupported) {
            throw new Error('Please open a conversation on Tinder, Bumble, Hinge, or Discord before generating suggestions.');
        }

        // Try to inject content script if needed
        await injectContentScript(tab.id);
        
        // Get messages from content script
        let response;
        try {
            response = await chrome.tabs.sendMessage(tab.id, { action: 'getMessages' });
        } catch (error) {
            console.error('Message error:', error);
            throw new Error('Could not connect to the dating app page. Please refresh the page and try again.');
        }
        
        if (!response || !response.messages || response.messages.length === 0) {
            throw new Error('No messages found. Make sure you have an active conversation open.');
        }

        // Display chat preview
        chatPreview.innerHTML = formatMessages(response.messages);

        // Generate and display suggestions
        const suggestions = await generateSuggestions(response.messages);
        displaySuggestions(suggestions);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        // Restore old suggestions on error
        suggestionsDiv.innerHTML = oldSuggestions;
    } finally {
        loadingDiv.style.display = 'none';
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'messagesUpdated') {
        chatPreview.innerHTML = formatMessages(request.messages);
    }
});
