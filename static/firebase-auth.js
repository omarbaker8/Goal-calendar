// Firebase configuration for client-side authentication
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, get ID token
        user.getIdToken().then((idToken) => {
            // Send token to server
            fetch('/api/verify_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: idToken })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to main calendar if on login page
                    if (window.location.pathname === '/login') {
                        window.location.href = '/';
                    }
                    // Load user data if on calendar page
                    if (typeof loadUserData === 'function') {
                        loadUserData();
                    }
                }
            });
        });
    } else {
        // User is signed out
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
});

// Login function
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // This is handled by the auth state change listener
        })
        .catch((error) => {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
        });
}

// Logout function
function signOut() {
    auth.signOut().then(() => {
        window.location.href = '/login';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}