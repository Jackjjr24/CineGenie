// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKIC0Hl16eMtB3CZ0LrcZE9tz2YqetOfA",
  authDomain: "storyboard-ai-fa410.firebaseapp.com",
  projectId: "storyboard-ai-fa410",
  storageBucket: "storyboard-ai-fa410.firebasestorage.app",
  messagingSenderId: "844291999753",
  appId: "1:844291999753:web:689028a7d1d327bfae90d8",
  measurementId: "G-HEHQFFXVF3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
