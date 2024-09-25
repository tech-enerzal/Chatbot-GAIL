from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)

CORS(app)

# Stream the response from the chatbot API
def stream_response(url, payload):
    try:
        with requests.post(url, json=payload, stream=True) as r:
            r.raise_for_status()
            for line in r.iter_lines():
                if line:
                    # Yield the streamed response in real-time to the frontend
                    yield line.decode('utf-8') + '\n'

    except Exception as e:
        yield jsonify({"error": f"Failed to fetch the assistant response: {str(e)}"})

# Function to decide the model based on some logic
def decide_model(conversation_history):
    # Example logic to choose the model
    if len(conversation_history) > 5:
        return "llama3.1:8b"  # Some large model for long conversations
    else:
        return "gemma2:2b"  # Some small model for short conversations

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Get the conversation history and other details from the request
        data = request.json
        messages = data.get('messages')

        # Decide the model on the server side
        model = decide_model(messages)

        # Prepare payload for the chatbot API
        payload = {
            'model': model,  # Chosen model
            'messages': messages,
            'stream': True,  # Enable streaming
            'keep_alive': 0
        }

        # Stream the response to the frontend
        return Response(stream_response('http://localhost:11434/api/chat', payload),
                        content_type='application/json')

    except Exception as e:
        return jsonify({'error': 'Failed to fetch the assistant response.'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
