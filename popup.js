// DOM Elements
const chatPreview = document.getElementById('chatPreview');
const suggestionsDiv = document.getElementById('suggestions');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const generateBtn = document.getElementById('generateBtn');

// OpenAI API configuration
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Function to load the API key from api_key.txt
async function getAPIKey() {
    const url = chrome.runtime.getURL('api_key.txt');
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to load API key');
    }
    return response.text().then(key => key.trim());
}

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
        padding: 20px;
        min-width: 500px;
        min-height: 600px;
        font-size: 16px;
        background-color: #fff5f7;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .title-container {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        gap: 10px;
    }
    .title-container h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
    }
    .suggestion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        margin: 10px 0;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .suggestion-text {
        flex-grow: 1;
        margin-right: 15px;
        line-height: 1.5;
        font-size: 15px;
    }
    .copy-button {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 15px;
        font-weight: 500;
    }
    .copy-button:hover {
        background-color: #1976D2;
        transform: translateY(-1px);
    }
    .user-message {
        background-color: #e3f2fd;
        padding: 12px 16px;
        margin: 6px 0;
        border-radius: 18px;
        max-width: 85%;
        margin-left: auto;
        text-align: right;
        font-size: 15px;
        line-height: 1.4;
    }
    .match-message {
        background-color: #f5f5f5;
        padding: 12px 16px;
        margin: 6px 0;
        border-radius: 18px;
        max-width: 85%;
        margin-right: auto;
        text-align: left;
        font-size: 15px;
        line-height: 1.4;
    }
    #chatPreview {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 15px;
        min-height: 40px;
        background-color: white;
        border-radius: 8px;
        margin-bottom: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    #suggestionsDiv {
        margin-top: 15px;
    }
    .context-container {
        margin: 12px 0;
        padding: 15px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .context-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 16px;
    }
    .context-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 15px;
        resize: vertical;
        min-height: 80px;
        box-sizing: border-box;
        line-height: 1.5;
    }
    .context-input::placeholder {
        color: #999;
    }
    #loadingDiv {
        text-align: center;
        padding: 15px;
        font-size: 16px;
    }
    #errorDiv {
        color: #d32f2f;
        padding: 12px;
        margin: 8px 0;
        border-radius: 6px;
        background-color: #ffebee;
        display: none;
        font-size: 15px;
    }
    #generateBtn {
        width: 100%;
        padding: 12px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        margin-top: 15px;
        transition: all 0.2s;
    }
    #generateBtn:hover {
        background-color: #1976D2;
        transform: translateY(-1px);
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

    return `Given this text conversation and knowing that I'm talking to ${contextInfo}, 
    Please analyze the conversation and provide 3 different possible responses to the latest message. 
    
    The responses should be:
    1. A friendly and casual response
    2. A funny and witty response
    3. An empathetic and understanding response
    
    Make sure each response maintains appropriate tone and context for the conversation.
    Be sure to reference details from their messages or the provided context.
    
    Additionally, follow these rules depending on the context of the conversation:
    For General Conversation, refer to these rules from How to Win Friends and Influence People by Dale Carnegie:
    Foster Positive Interactions:
    Avoid criticism and negativity; use positive reinforcement to build trust and open communication.
    Appreciate Sincerely:
    Genuinely acknowledge others' efforts to make them feel valued and boost self-esteem.
    Align Interests:
    Frame your requests in terms of benefits to them, creating mutual motivation and cooperation.
    Cultivate Genuine Interest:
    Show sincere curiosity about others' needs and desires to form deeper connections.
    Encourage Conversational Engagement:
    Listen actively and invite others to share, building respect and understanding.
    Avoid Confrontation:
    Steer clear of arguments and respect differing opinions to maintain harmony.
    Admit Mistakes:
    Quickly acknowledge your errors to demonstrate honesty, humility, and build trust.
    Begin with Positivity:
    Start conversations on a positive note to ease future criticisms and foster collaboration.
    Encourage and Praise:
    Offer sincere, frequent praise to inspire growth and reinforce positive behavior.
    Empower and Validate:
    Make others feel that ideas are their own to boost commitment and creativity.
    Dramatize Ideas:
    Present ideas vividly to capture attention and make your message memorable.
    Throw Down a Challenge:
    Introduce challenges to ignite competitive energy and turn routine tasks into engaging opportunities
    
    For a more flirty or seductive context, refer to these rules from the Art of Seduction by Robert Greene:
    Initiate Indirectly:
    Start your conversation subtly. Let your interest emerge gradually rather than coming on too strong right away.
    Maintain a Mysterious Aura:
    Send playful, mixed signals that leave room for interpretation. A little mystery keeps your target curious and engaged.
    Cultivate Desirability:
    Hint that you're sought after—mention, even subtly, that you're admired by others. This not only builds your allure but also makes your attention feel special.
    Ignite Curiosity and Temptation:
    Tease with hints of exciting possibilities or experiences they might be missing out on, creating a subtle sense of need.
    Master Subtle Insinuation:
    Plant ideas with playful, indirect comments that let your target's imagination fill in the gaps.
    Mirror Their Spirit:
    Adapt your tone and topics to resonate with their interests and moods, showing genuine understanding and empathy.
    Keep the Conversation Unpredictable:
    Avoid routine by varying your message style—introduce surprises and unexpected twists to maintain suspense.
    Let Your Words Work Magic:
    Choose evocative, emotionally charged language that blurs the lines between fantasy and reality, drawing them deeper into the conversation.
    Balance Bold Moves with Gentle Withdrawal:
    At the right moment, send a decisive, bold message to signal clear interest, then pull back slightly to let them miss you and keep the dynamic engaging.
    
    Here's the conversation:
    ${conversation}
    
    Format each response on its own line.`;
}

// Generate suggestions using OpenAI
async function generateSuggestions(messages) {
    try {
        const apiKey = await getAPIKey();
        const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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
            .map(s => s.includes(':') ? s.split(':').slice(1).join(':').trim() : s) // Remove leading colon
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
                button.textContent = 'Copied!';
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
                    button.textContent = 'Copied!';
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

// Initialize popup and scrape conversation
async function initializePopup() {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';

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
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Handle generate button click - now handles suggestion generation
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

// Initialize popup when it loads
document.addEventListener('DOMContentLoaded', initializePopup);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'messagesUpdated') {
        chatPreview.innerHTML = formatMessages(request.messages);
    }
});
