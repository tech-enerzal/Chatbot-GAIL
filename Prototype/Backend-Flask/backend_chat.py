from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import os
from werkzeug.utils import secure_filename
import PyPDF2
import docx

app = Flask(__name__)
CORS(app)

# Directory to store uploaded files temporarily
UPLOAD_FOLDER = '/Temp'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Helper function to check if the file is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to read the content of the file
def read_file_content(file_path, file_type):
    if file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif file_type == 'pdf':
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ''
            for page in range(len(reader.pages)):
                text += reader.pages[page].extract_text()
            return text
    elif file_type == 'docx':
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return ''

# Endpoint to handle file uploads
@app.route('/api/upload', methods=['POST'])
def upload_file():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    # If user does not select a file, the browser also
    # submits an empty part without a filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Extract the file type and read content
        file_type = filename.rsplit('.', 1)[1].lower()
        file_content = read_file_content(file_path, file_type)

        # Remove the file after reading it
        os.remove(file_path)

        # Return the extracted content
        return jsonify({'content': file_content}), 200

    return jsonify({'error': 'File type not allowed'}), 400

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
    # # Example logic to choose the model
    # if len(conversation_history) > 5:
    #     return "llama3.1:8b"  # Some large model for long conversations
    # else:
    #     return "gemma2:2b"  # Some small model for short conversations
    return "llama3.1:8b"  # Large model for heavy lifting (e.g., document parsing)

# Chatbot endpoint for handling messages and file content
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
            'options': {
                "temperature": 0.8,
                "num_predict": 100,
            },
            'stream': True,  # Enable streaming
            'keep_alive': 0
        }

        # Stream the response to the frontend
        return Response(stream_response('http://localhost:11434/api/chat', payload),
                        content_type='application/json')

    except Exception as e:
        return jsonify({'error': 'Failed to fetch the assistant response.'}), 500

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(host='0.0.0.0', port=5000, debug=True)
