import time
import traceback
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from auth import authenticate
from database import get_mongodb_client, save_emails_to_mongodb
from email_utils import process_email, send_feedback_request
from config import SLEEP_TIME

server_start_time = int(time.time() * 1000)  # Current time in milliseconds

def fetch_new_emails(service):
    query = f'after:{int(server_start_time/1000)}'  # Convert to seconds
    try:
        results = service.users().messages().list(userId='me', q=query).execute()
        messages = results.get('messages', [])
        print(f"Fetched {len(messages)} new messages.")
        return messages
    except HttpError as error:
        print(f"An error occurred while fetching emails: {error}")
        return []

def process_emails(service, client):
    messages = fetch_new_emails(service)
    if messages:
        for message in messages:
            try:
                email_data = process_email(message, service, client)
                if email_data:
                    save_emails_to_mongodb([email_data], service, client)
                    print(f"Processed and saved email: {email_data['subject']}")
                    send_feedback_request(service, email_data['email'], email_data['subject'], email_data['_id'])
                    print(f"Sent autoresponse to: {email_data['email']}")
            except Exception as e:
                print(f"Error processing email: {e}")
                traceback.print_exc()
    else:
        print("No new emails. Waiting for next check...")

def start_email_processing():
    creds = authenticate()
    service = build('gmail', 'v1', credentials=creds)
    client = get_mongodb_client()

    print(f"Server started at: {time.ctime(server_start_time/1000)}")
    print("Monitoring for new emails...")

    while True:
        try:
            process_emails(service, client)
        except Exception as e:
            print(f"An error occurred in the main loop: {e}")
            traceback.print_exc()
        time.sleep(SLEEP_TIME)

    client.close()