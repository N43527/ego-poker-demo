// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBpZUfu31W_0z9CxI2tVGc6fIwDpAq5lD0",
  authDomain: "ego-demo.firebaseapp.com",
  projectId: "ego-demo",
  storageBucket: "ego-demo.firebasestorage.app",
  messagingSenderId: "6937934046",
  appId: "1:6937934046:web:75038e4b2227be6f28ea4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);