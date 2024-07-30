from app.routes import bp
from flask import render_template, redirect, url_for, session, request, jsonify, Blueprint
from app import mongo
from bson import ObjectId
from bson.errors import InvalidId

@bp.route('/')
def main_home():
    return render_template('main_home.html')




@bp.route('/account')
def account_page():
    if 'username' not in session:
        return redirect(url_for('auth.login'))

    try:
        accounts = mongo.db.account.find_one({'user': session['username']})
        if accounts is None:
            # Handle case where no account was found
            return render_template('account.html', accounts=None, error="No account found for this user.")
    except InvalidId:
        # Handle case where the username in the session is invalid
        return render_template('account.html', accounts=None, error="Invalid user ID.")
    
    return render_template('account.html', accounts=accounts)


@bp.route('/notification')
def notification_page():
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    notification = mongo.db.notification.find_one({'user': session['username']})
    return render_template('notification.html', notification=notification)

@bp.route('/help')
def help_page():
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    help = mongo.db.help.find_one({'user': session['username']})
    return render_template('help.html', help=help)

@bp.route('/customers')
def customers_page():
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    return render_template('customers.html')

@bp.route('/settings')
def settings_page():
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    settings = mongo.db.settings.find_one({'user': session['username']})
    return render_template('settings.html', settings=settings)

# New routes for customer management

@bp.route('/customer/fetch_customers', methods=['GET'])
def fetch_customers():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    customers = list(mongo.db.customers.find())
    for customer in customers:
        customer['_id'] = str(customer['_id'])
    return jsonify(customers)

@bp.route('/customer/add_user', methods=['POST'])
def add_user():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    customer_data = {
        'customer_id': request.form.get('customerId'),
        'customer_name': request.form.get('customerName'),
        'email': request.form.get('email'),
        'contact_number': request.form.get('contactNumber'),
        'status': request.form.get('status')
    }
    result = mongo.db.customers.insert_one(customer_data)
    return jsonify({'message': 'User added successfully', 'id': str(result.inserted_id)})

@bp.route('/customer/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    result = mongo.db.customers.delete_one({'_id': ObjectId(user_id)})
    if result.deleted_count:
        return jsonify({'message': 'User deleted successfully'})
    else:
        return jsonify({'error': 'User not found'}), 404