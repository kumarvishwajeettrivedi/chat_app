import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDdQmumURIiElxtY_rlHuVOLd_Cd6Bt9Kw",
  authDomain: "chatbot1-b1c09.firebaseapp.com",
  projectId: "chatbot1-b1c09",
  storageBucket: "chatbot1-b1c09.appspot.com",
  messagingSenderId: "407782433117",
  appId: "1:407782433117:web:4a1ef974335a4400f488b4",
  measurementId: "G-M6C7FCBWDN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore

export { app, db, analytics }; // Export db along with app and analytics
