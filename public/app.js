// Firebase Service References (Storage removed)
const auth = firebase.auth();
const db = firebase.firestore();

// Supabase Configuration
const SUPABASE_URL = 'https://xjgvjvhfrtrcpobztbvf.supabase.co'; // e.g., https://xyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3ZqdmhmcnRyY3BvYnp0YnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTM1NDMsImV4cCI6MjEwNTY2OTU0M30.XHjpY9qZekV22l-JpBF5TnAAO2_jm11oBRuNrVBZtM4';
const BUCKET_NAME = 'BaasLabstorage';

// DOM Elements
const whenSignedOut = document.getElementById('whenSignedOut');
const whenSignedIn = document.getElementById('whenSignedIn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signOutBtn = document.getElementById('signOutBtn');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const fileList = document.getElementById('fileList');

let unsubscribe;

// 1. Authentication (Login or Auto-Register)
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  
  try {
    // 1. Attempt to log in
    await auth.signInWithEmailAndPassword(email, password);
  } catch (loginError) {
    // 2. If login fails for ANY reason (wrong password, no account, etc.), try to register
    try {
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (registerError) {
      alert("Error: " + registerError.message);
    }
  }
};

signOutBtn.onclick = () => auth.signOut();

// Listen for Auth State Changes
auth.onAuthStateChanged(user => {
  if (user) {
    whenSignedIn.hidden = false;
    whenSignedOut.hidden = true;
    loadFiles(user.uid);
  } else {
    whenSignedIn.hidden = true;
    whenSignedOut.hidden = false;
    if (unsubscribe) unsubscribe();
    fileList.innerHTML = '';
  }
});

// 2. Upload File with Progress Bar (Via Supabase)
uploadBtn.onclick = () => {
  const file = fileInput.files[0];
  if (!file) return alert('Select a file first!');
  
  const user = auth.currentUser;
  
  // Create a unique file path to prevent overwriting files with the same name
  const filePath = `users/${user.uid}/${Date.now()}-${file.name}`; 
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
  
  progressBar.style.display = 'block';
  
  // Use native XHR to track upload progress accurately
  const xhr = new XMLHttpRequest();
  xhr.open('POST', uploadUrl, true);
  
  // Supabase REST API Headers
  xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
  xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
  
  // Monitor Upload Progress
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const progress = (e.loaded / e.total) * 100;
      progressBar.value = progress;
      statusText.innerText = `Upload is ${Math.round(progress)}% done`;
    }
  };
  
  // Handle Upload Completion
  xhr.onload = async () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      statusText.innerText = 'Upload successful!';
      
      // Construct the public download URL from Supabase
      const downloadURL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
      
      // Save Metadata back to Firebase Firestore
      const { serverTimestamp } = firebase.firestore.FieldValue;
      await db.collection('files').add({
        uid: user.uid,
        name: file.name,
        url: downloadURL,
        createdAt: serverTimestamp()
      });
      
      // Reset UI
      fileInput.value = '';
      setTimeout(() => { 
        progressBar.style.display = 'none'; 
        statusText.innerText = ''; 
      }, 3000);
      
    } else {
      statusText.innerText = `Upload Failed: ${xhr.responseText}`;
    }
  };
  
  xhr.onerror = () => {
    statusText.innerText = 'Network error during upload.';
  };
  
  xhr.send(file);
};

// 3. Retrieve and Display Files in Real-time (Via Firestore)
function loadFiles(uid) {
  unsubscribe = db.collection('files')
    .where('uid', '==', uid)
    .onSnapshot(querySnapshot => {
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Create an anchor tag using the Supabase Download URL stored in Firestore
        return `<li><a href="${data.url}" target="_blank">${data.name}</a></li>`;
      });
      fileList.innerHTML = items.join('');
    });
}