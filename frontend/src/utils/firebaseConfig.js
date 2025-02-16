// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6JsJWlKjamsXbQADYgnL0I_azzd6iCbc",
  authDomain: "buildtrack-c3e8a.firebaseapp.com",
  projectId: "buildtrack-c3e8a",
  storageBucket: "buildtrack-c3e8a.firebasestorage.app",
  messagingSenderId: "476988217137",
  appId: "1:476988217137:web:6bb9fcd0a8da83b6a24210",
  measurementId: "G-BWVSFQNW76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics }; 