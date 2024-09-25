document.addEventListener('DOMContentLoaded', function() {
    const chatBubbles = document.querySelector('.chat-bubbles');
    const initialBubbles = document.querySelector('.initial-bubbles');
    const sendButton = document.getElementById('sendButton');
    const input = document.getElementById('userInput');
    const logo = document.getElementById('logo');
    
    
    // Handle click on initial chat bubbles
    document.querySelectorAll('.initial-bubbles .chat-bubble').forEach(bubble => {
        bubble.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            sendMessage(message);
        });
    });
    
    // Handle send button click
    sendButton.addEventListener('click', function() {
        const message = input.value.trim();
        if (message !== '') {
            sendMessage(message);
        }
    });
    
    // Handle ENTER key press
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default new line in textarea
            const message = input.value.trim();
            if (message !== '') {
                sendMessage(message);
            }
        }
    });
    
    let conversationHistory = []; // Array to hold the chat history

    async function sendMessage(message) {
        if (message) {
            // Remove initial bubbles and logo
            if (initialBubbles) {
                initialBubbles.remove();
            }
            if (logo) {
                logo.remove();
            }
    
            // Create user message bubble
            const userBubble = document.createElement('div');
            userBubble.className = 'chat-bubble chat-bubble-user shadow-sm';
            userBubble.innerHTML = `<p>${message}</p>`;
            chatBubbles.appendChild(userBubble);
    
            // Add the user's message to the conversation history
            conversationHistory.push({ role: "user", content: message });
    
            // Clear input and disable it
            input.value = '';
            input.disabled = true; // Disable input while waiting for response
            chatBubbles.scrollTop = chatBubbles.scrollHeight; // Scroll to bottom
    
            try {
                // Fetch the response from the Flask backend
                const response = await fetch("http://localhost:5000/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: conversationHistory // Send conversation history only
                    })
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
    
                // Create assistant response bubble (empty initially)
                const assistantBubble = document.createElement('div');
                assistantBubble.className = 'chat-bubble chat-bubble-assistant shadow-sm';
                chatBubbles.appendChild(assistantBubble);
    
                // Read and process the streamed response
                const reader = response.body.getReader();
                let decoder = new TextDecoder();
                let assistantMessage = '';
    
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break; // Stream finished
    
                    // Decode the chunk
                    const chunk = decoder.decode(value);
                    const jsonChunks = chunk.split('\n'); // Handle chunked JSON lines
    
                    jsonChunks.forEach(jsonChunk => {
                        if (jsonChunk.trim()) {
                            const data = JSON.parse(jsonChunk);
    
                            if (data.message && data.message.content) {
                                // Append new content to the assistant message
                                assistantMessage += data.message.content;
    
                                // Use marked.js to convert Markdown to HTML
                                const assistantMessageHTML = marked.parse(assistantMessage);
    
                                // Update the assistant bubble with the parsed content
                                assistantBubble.innerHTML = `<p>${assistantMessageHTML}</p>`;
                            }
                        }
                    });
    
                    chatBubbles.scrollTop = chatBubbles.scrollHeight; // Scroll to bottom as content comes in
                }
    
                // Final conversion of the full assistant message once streaming is done
                const finalAssistantMessageHTML = marked.parse(assistantMessage);
                assistantBubble.innerHTML = `<p>${finalAssistantMessageHTML}</p>`;
    
                // Add the assistant's message to the conversation history
                conversationHistory.push({ role: "assistant", content: assistantMessage });
    
            } catch (error) {
                console.error("Error:", error);
                // Display error message to user
                const assistantBubble = document.createElement('div');
                assistantBubble.className = 'chat-bubble chat-bubble-assistant shadow-sm';
                assistantBubble.innerHTML = `<p>Sorry, I encountered an error. Please try again later.</p>`;
                chatBubbles.appendChild(assistantBubble);
            }
    
            // Re-enable input
            input.disabled = false;
            chatBubbles.scrollTop = chatBubbles.scrollHeight; // Scroll to bottom
        }
    }  
});
