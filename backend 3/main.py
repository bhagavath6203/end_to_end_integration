import threading
from email_processor import start_email_processing
from feedback_server import app

if __name__ == '__main__':
    # Start the email processing in a separate thread
    email_thread = threading.Thread(target=start_email_processing)
    email_thread.start()

    # Start the Flask server
    app.run(debug=True)