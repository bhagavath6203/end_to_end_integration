from app.routes import bp
from flask import render_template, session, redirect, url_for, request, flash, jsonify
import secrets
from app import mongo
from bson import ObjectId
from bson.json_util import dumps



@bp.route('/api/tickets', methods=['GET'])
def get_tickets():
    collection_name = "issues"  # Specify your collection name here
    tickets = mongo.db[collection_name].find()
    return dumps(tickets)


# View class details route with class_id: Render class details page

@bp.route('/class/<class_id>', methods=['GET', 'POST'])
def class_details(class_id):
    class_data = mongo.db.classes.find_one({'_id': ObjectId(class_id)})
    examples = list(mongo.db.examples.find({'class_id': ObjectId(class_id)}))
    
    return render_template('class_details.html', class_details=class_data, examples=examples, class_id=class_id)

# Add class credentials POST request route: Handle adding new class credentials
@bp.route('/new_class_credentials', methods=['POST'])
def new_class_credentials():
    name = request.form.get('name')
    description = request.form.get('description')
    examples = request.form.getlist('examples[]')
    autoresponses = request.form.getlist('autoresponses[]')

    class_id = secrets.randbelow(1000)  # Generate a random class_id

    # Insert class details into 'add_class' collection in MongoDB
    mongo.db.add_class.insert_one({
        'class_id': class_id,
        'class_name': name,
        'description': description
    })

    # Insert examples into 'examples' collection
    for example in examples:
        mongo.db.examples.insert_one({
            'class_id': class_id,
            'example_data': example
        })

    # Insert autoresponses into 'autoresponses' collection
    for autoresponse in autoresponses:
        if autoresponse:  # Only insert non-empty autoresponses
            mongo.db.autoresponses.insert_one({
                'class_id': class_id,
                'response': autoresponse
            })

    flash('Class added successfully with examples and autoresponses', 'success')
    return redirect(url_for('auth.classification_config'))

# Add class page route: Render add class page
@bp.route('/add_class', methods=['GET', 'POST'])
def add_class():
    if 'username' not in session:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        return new_class_credentials()
    
    return render_template('add_class.html')


# Delete class route with class_id: Handle deleting class
@bp.route('/delete_class/<class_id>', methods=['DELETE'])
def delete_class(class_id):
    try:
        result = mongo.db.add_class.delete_one({'class_id': int(class_id)})
        if result.deleted_count == 1:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'success': False, 'error': 'Class not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    



@bp.route('/view_class_details/<class_id>')
def view_class_details(class_id):
    if 'username' not in session:
        return redirect(url_for('auth.login'))

    try:
        class_details = mongo.db.add_class.find_one({'class_id': int(class_id)})
        if not class_details:
            flash('Class not found', 'danger')
            return redirect(url_for('auth.add_class'))

        examples = list(mongo.db.examples.find({'class_id': int(class_id)}))
        autoresponses = list(mongo.db.autoresponses.find({'class_id': int(class_id)}))
        return render_template('add_class.html', class_details=class_details, examples=examples, autoresponses=autoresponses)
    except Exception as e:
        flash(f'An error occurred: {e}', 'danger')
        return redirect(url_for('auth.add_class'))

@bp.route('/edit_class/<int:class_id>', methods=['POST'])
def edit_class(class_id):
    if 'username' not in session:
        return redirect(url_for('auth.login'))

    name = request.form.get('name')
    description = request.form.get('description')
    examples = request.form.getlist('examples[]')
    autoresponses = request.form.getlist('autoresponses[]')

    if not name or not description or len(examples) < 3:
        flash('Please fill in all required fields and provide at least 3 examples.', 'danger')
        return redirect(url_for('auth.view_class_details', class_id=class_id))

    try:
        # Update class details
        mongo.db.add_class.update_one(
            {'class_id': class_id},
            {'$set': {'class_name': name, 'description': description}}
        )

        # Update examples
        mongo.db.examples.delete_many({'class_id': class_id})
        for example in examples:
            mongo.db.examples.insert_one({'class_id': class_id, 'example_data': example})

        # Update autoresponses
        mongo.db.autoresponses.delete_many({'class_id': class_id})
        for autoresponse in autoresponses:
            if autoresponse:  # Only insert non-empty autoresponses
                mongo.db.autoresponses.insert_one({'class_id': class_id, 'response': autoresponse})

        flash('Class updated successfully', 'success')
        return redirect(url_for('auth.view_class_details', class_id=class_id))
    except Exception as e:
        flash(f'An error occurred: {e}', 'danger')
        return redirect(url_for('auth.view_class_details', class_id=class_id))