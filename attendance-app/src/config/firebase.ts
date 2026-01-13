import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhJmSh60mrrWJ8r_-1ETpbNTkdbDGO_p4",
  authDomain: "attendance-37566.firebaseapp.com",
  projectId: "attendance-37566",
  storageBucket: "attendance-37566.firebasestorage.app",
  messagingSenderId: "282112336688",
  appId: "1:282112336688:ios:f46fc4b04ee1bef0e4def5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
