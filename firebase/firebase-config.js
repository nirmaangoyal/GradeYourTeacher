import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import serviceAccount from './pantry-tracker-bee18-firebase-adminsdk-zhwu3-c15926ad04.json' assert { type: "json" };

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pantry-tracker-bee18.appspot.com'
});

const firestore = admin.firestore();
const storage = admin.storage().bucket();
const adminAuth = admin.auth();

// Initialize Firebase Client SDK
const clientApp = initializeApp({
    apiKey: "AIzaSyD8lVM_-Bwl7gc9ct766e9W0Gb4yHVk2uA",
    authDomain: "pantry-tracker-bee18.firebaseapp.com",
    projectId: "pantry-tracker-bee18",
    storageBucket: "pantry-tracker-bee18.appspot.com",
    messagingSenderId: "991988201200",
    appId: "1:991988201200:web:064c79bcaa47cb020b3435",
    measurementId: "G-D9RHHH9FXF"
});

const clientAuth = getAuth(clientApp);


export { firestore, storage, adminAuth, clientAuth, admin };