import base64
import uuid
import time
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import cohere 
from config import COHERE_API_KEY

# Initialize Cohere Client
co = cohere.Client(COHERE_API_KEY)

def process_email(message, service, client):
    message_details = service.users().messages().get(userId='me', id=message['id']).execute()
    
    sender = next((header['value'] for header in message_details['payload']['headers'] if header['name'] == 'From'), '')
    subject = next((header['value'] for header in message_details['payload']['headers'] if header['name'] == 'Subject'), '')
    
    if 'Mail Delivery Subsystem' in sender:
        return None

    email_body = ''
    if 'data' in message_details['payload']['body']:
        email_body = base64.urlsafe_b64decode(message_details['payload']['body']['data']).decode('utf-8')
    else:
        for part in message_details['payload']['parts']:
            if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                email_body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                break

    classification, confidence = classify_emails(email_body, client)

    return {
        '_id': str(uuid.uuid4()),
        'id': message['id'],
        'email': sender,
        'subject': subject,
        'createdAt': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(int(message_details['internalDate']) / 1000)),
        'classification': classification,
        'confidence': confidence,
        'email_body': email_body
    }

def send_email(service, to, subject, body_plain, body_html=None):
    if body_html:
        raw_message = f"To: {to}\nSubject: {subject}\nContent-Type: text/html; charset=UTF-8\n\n{body_html}"
    else:
        raw_message = f"To: {to}\nSubject: {subject}\n\n{body_plain}"
    
    message = {
        'raw': base64.urlsafe_b64encode(raw_message.encode()).decode()
    }

    try:
        service.users().messages().send(userId='me', body=message).execute()
        print(f"Email sent to {to}")
    except Exception as e:
        print(f"Failed to send email to {to}: {e}")

def send_feedback_request(service, sender, subject, unique_id):
    feedback_request_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket System Email</title>
        <style>
            /* Your CSS styles here */
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Thank You for Reaching Out!</h1>
            </div>
            <div class="section">
                <p>We have received your issue:</p>
                <p><strong>{subject}</strong></p>
            </div>
            <div class="button-container">
                <p>Please click one of the following buttons to indicate the status:</p>
                <a href="http://localhost:5000/feedback/{unique_id}/solved" style="text-decoration:none;">
                    <button style="padding:10px 15px; background-color:green; color:white; border:none; border-radius:5px; cursor:pointer;">Solved</button>
                </a>
                <a href="http://localhost:5000/feedback/{unique_id}/unsolved" style="text-decoration:none;">
                    <button style="padding:10px 15px; background-color:red; color:white; border:none; border-radius:5px; cursor:pointer;">Unsolved</button>
                </a>
            </div>
            <div class="footer">
                <p>Contact us: support@example.com | +1 234 567 890</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    print(f"Attempting to send autoresponse to: {sender}")
    send_email(service, sender, "Re: " + subject, "Please view this email in HTML format.", feedback_request_html)
    print(f"Autoresponse sent successfully to: {sender}")

def fetch_category_data(client):
    db = client['cutica']
    category_collection = db['category']

    category_data = category_collection.find()

    examples = []
    for doc in category_data:
        if 'message' in doc and 'label' in doc:
            examples.append({"text": doc['message'], "label": doc['label']})
    
    if not examples:
        raise ValueError("No valid category data found in the 'category' collection")
    
    return examples

def classify_emails(email_body, client):
    co = cohere.Client(COHERE_API_KEY)
    
    examples = fetch_category_data(client)

    classification = ""
    confidence = 0.0

    if email_body:
        classification_response = co.classify(
            inputs=[email_body],  
            examples=examples,
        )   
        
        classification = classification_response.classifications[0].prediction
        confidence = classification_response.classifications[0].confidence

    return classification, confidence
