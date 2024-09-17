document.getElementById('sendBtn').addEventListener('click', async function () {
    const userInput = document.getElementById('userInput').value;

    if (userInput) {
        // Display the user's message
        const chatArea = document.getElementById('chat-area');
        const userBubble = document.createElement('div');
        userBubble.classList.add('col-md-3', 'chat-bubble');
        userBubble.innerHTML = `<h5>You</h5><p>${userInput}</p>`;
        chatArea.appendChild(userBubble);

        // Call GPT-Neo API
        const response = await fetchGPTNeo(userInput);

        // Display the chatbot's response
        const botBubble = document.createElement('div');
        botBubble.classList.add('col-md-3', 'chat-bubble');
        botBubble.innerHTML = `<h5>Gemini</h5><p>${response}</p>`;
        chatArea.appendChild(botBubble);

        // Clear input field
        document.getElementById('userInput').value = '';
    }
});

async function fetchGPTNeo(userInput) {
    // const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBTCbCChsTehLY-BT6rcmCUXYYL0DCz_a8';  // GPT-Neo Model API
    // const apiKey = 'AIzaSyBTCbCChsTehLY-BT6rcmCUXYYL0DCz_a8';  // Your Hugging Face API token

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBTCbCChsTehLY-BT6rcmCUXYYL0DCz_a8';

    try {
        // const response = await fetch(apiUrl, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${apiKey}`,  // Ensure apiKey is a string
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ inputs: userInput })  // Sending user input as JSON
        // });

        const requestBody = {
            contents: [{
              parts: [{ text: userInput }]
            }]
          };
      
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

        // Log the raw response for debugging
        console.log("Raw response:", response);

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API result:", result);  // Log the API result

        if (result.error) {
            throw new Error(result.error);
        }

        return result[0]?.generated_text || "No response generated.";  // Return the generated text

    } catch (error) {
        console.error('Error fetching GPT-Neo response:', error);
        return "Sorry, I'm having trouble understanding that. Please try again.";  // Fallback error message
    }
}
