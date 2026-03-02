// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAjK79x_N5pSWzWluFUg25mqEc_HeraRPk",
  authDomain: "epic-latin.firebaseapp.com",
  projectId: "epic-latin",
  storageBucket: "epic-latin.firebasestorage.app",
  messagingSenderId: "321050459278",
  appId: "1:321050459278:web:df00b3cf5b8befb0d55ddf",
  measurementId: "G-KEWLZ67Z61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT these so they can be imported anywhere in your app
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// @ts-ignore
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'epic-latin-prod';
