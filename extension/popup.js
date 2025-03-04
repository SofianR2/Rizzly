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

// Format messages for OpenAI
function formatPrompt(messages) {
    const conversation = messages.map(msg => 
        `${msg.sender === 'user' ? 'You' : 'Match'}: ${msg.text}`
    ).join('\n');
    
    return `Here's a conversation from a dating app. Please suggest 3 engaging, flirty, and authentic responses that I could send next. Make them different in tone and approach, but all should be natural and genuine:

${conversation}

Please provide 3 different response options that are flirty, engaging, and authentic. Avoid being creepy or overly aggressive.`;
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
            throw new Error('Failed to generate suggestions');
        }

        const data = await response.json();
        return data.choices[0].message.content.split('\n').filter(s => s.trim());
    } catch (error) {
        throw new Error('Failed to generate suggestions: ' + error.message);
    }
}

// Display suggestions in the popup
function displaySuggestions(suggestions) {
    suggestionsDiv.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion" onclick="copyToClipboard('${suggestion}')">${suggestion}</div>`
    ).join('');
}

// Copy suggestion to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback that text was copied
        const suggestions = document.querySelectorAll('.suggestion');
        suggestions.forEach(s => {
            if (s.textContent === text) {
                s.style.background = '#c8e6c9';
                setTimeout(() => s.style.background = '#e3f2fd', 500);
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

// Handle generate button click
generateBtn.addEventListener('click', async () => {
    loadingDiv.style.display = 'block';
    suggestionsDiv.innerHTML = '';
    errorDiv.style.display = 'none';

    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get messages from content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getMessages' });
        
        if (!response.messages || response.messages.length === 0) {
            throw new Error('No messages found');
        }

        // Display chat preview
        chatPreview.innerHTML = formatMessages(response.messages);

        // Generate and display suggestions
        const suggestions = await generateSuggestions(response.messages);
        displaySuggestions(suggestions);
    } catch (error) {
        showError(error.message);
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