from pymongo import MongoClient
from config import MONGODB_URI, DATABASE_NAME, COLLECTION_NAMES
from email_utils import process_email, send_feedback_request

def get_mongodb_client():
    return MongoClient(MONGODB_URI)

# ... (keep other imports and functions as they are)

def save_emails_to_mongodb(messages, service, client):
    db = client[DATABASE_NAME]
    classification_collection = db[COLLECTION_NAMES['classification']]
    feedbacks_collection = db[COLLECTION_NAMES['feedbacks']]

    for message in messages:
        email_data = process_email(message, service, client)
        if email_data:
            classification_collection.insert_one(email_data)
            save_feedback(email_data, feedbacks_collection)
            send_feedback_request(service, email_data['email'], email_data['subject'], email_data['_id'])
            print(f"Processed and saved email: {email_data['subject']}")

# ... (keep other functions as they are)
def save_feedback(email_data, feedbacks_collection):
    feedback_data = {
        '_id': email_data['_id'],
        'id': email_data['id'],
        'email': email_data['email'],
        'status': 'unsolved',
        'subject': email_data['subject'],
        'body': email_data['email_body'],
        'createdAt': email_data['createdAt'],
        'ticketStatus': 'Ticket is open'
    }
    feedbacks_collection.insert_one(feedback_data)

def update_feedback_status(unique_id, status):
    client = get_mongodb_client()
    db = client[DATABASE_NAME]
    feedbacks_collection = db[COLLECTION_NAMES['feedbacks']]
    
    update_data = {'status': status}
    if status == "solved":
        update_data['ticketStatus'] = "Ticket is closed"
    elif status == "unsolved":
        update_data['ticketStatus'] = "Ticket is open"

    result = feedbacks_collection.update_one(
        {'_id': unique_id},
        {'$set': update_data}
    )
    
    client.close()
    return result.matched_count > 0

def get_user_details(unique_id):
    client = get_mongodb_client()
    db = client[DATABASE_NAME]
    feedbacks_collection = db[COLLECTION_NAMES['feedbacks']]
    
    user = feedbacks_collection.find_one({'_id': unique_id})
    client.close()
    return user

def send_email_to_support(user_details):
    # Implement this function to send email to support team
    # You can use a library like smtplib to send emails
    pass