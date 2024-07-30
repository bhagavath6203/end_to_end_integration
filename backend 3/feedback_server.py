from flask import Flask, render_template
from database import update_feedback_status, get_user_details, send_email_to_support

app = Flask(__name__)

@app.route('/feedback/<unique_id>/<status>', methods=['GET'])
def handle_feedback(unique_id, status):
    print(f"Received request for {status} update for ID: {unique_id}")

    if update_feedback_status(unique_id, status):
        if status == "solved":
            return render_template('feedback_message.html', message="Thank you for your Feedback. Your Ticket is closed"), 200
        elif status == "unsolved":
            user_details = get_user_details(unique_id)
            send_email_to_support(user_details)
            return render_template('feedback_message.html', message="Your complaint is forwarded."), 200
    else:
        return render_template('feedback_message.html', message="An error occurred while processing your request."), 400