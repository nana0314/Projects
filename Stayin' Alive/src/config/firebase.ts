import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { Platform } from 'react-native';

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

// Connect to emulator in development (for local testing)
// Set USE_EMULATOR=true in your environment or use __DEV__ for React Native
if (__DEV__ && Platform.OS !== 'web') {
  // For React Native, use your computer's IP address instead of localhost
  // Replace with your computer's IP: connectFirestoreEmulator(db, '192.168.x.x', 8080);
  // For now, comment out if testing on device - emulator only works on local machine
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
