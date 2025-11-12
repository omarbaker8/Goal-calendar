from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from functools import wraps
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Initialize Firebase Admin SDK
cred = credentials.Certificate('firebase-config.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def login_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Main calendar view - requires login"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('calendar.html', user_email=session.get('user_email'))

@app.route('/login')
def login():
    """Login page"""
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout route"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/verify_token', methods=['POST'])
def verify_token():
    """Verify Firebase ID token and create session"""
    try:
        id_token = request.json.get('idToken')
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
        user_email = decoded_token.get('email', '')
        
        # Create session
        session['user_id'] = user_id
        session['user_email'] = user_email
        
        return jsonify({'success': True, 'user_id': user_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/save_progress', methods=['POST'])
@login_required
def save_progress():
    """Save user's calendar progress to Firestore"""
    try:
        user_id = session['user_id']
        progress_data = request.json.get('progress', {})
        theme = request.json.get('theme', '#111827')
        
        print(f"DEBUG: Saving progress for user {user_id}")
        print(f"DEBUG: Progress data received: {progress_data}")
        print(f"DEBUG: Theme: {theme}")
        
        # Save to Firestore
        user_doc = db.collection('users').document(user_id)
        
        # Update specific fields while preserving others
        # The key insight: we need to replace the entire 'progress' field, not merge it
        # so that deleted entries (toggled off days) are actually removed
        user_doc.update({
            'progress': progress_data,
            'theme': theme,
            'last_updated': firestore.SERVER_TIMESTAMP
        })
        
        print(f"DEBUG: Successfully saved to Firestore")
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"DEBUG: Error saving progress: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/load_progress', methods=['GET'])
@login_required
def load_progress():
    """Load user's calendar progress from Firestore"""
    try:
        user_id = session['user_id']
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            data = user_doc.to_dict()
            progress_data = data.get('progress', {})
            theme_data = data.get('theme', '#111827')
            
            print(f"DEBUG: Loading progress for user {user_id}")
            print(f"DEBUG: Raw document data: {data}")
            print(f"DEBUG: Progress data to return: {progress_data}")
            print(f"DEBUG: Theme data to return: {theme_data}")
            
            return jsonify({
                'success': True,
                'progress': progress_data,
                'theme': theme_data
            })
        else:
            print(f"DEBUG: No document found for user {user_id}, returning empty data")
            # Return empty progress for new users
            return jsonify({
                'success': True,
                'progress': {},
                'theme': '#111827'
            })
    except Exception as e:
        print(f"DEBUG: Error loading progress: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return redirect(url_for('static', filename='favicon.ico'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0' , port=1350)