// src/config/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjK79x_N5pSWzWluFUg25mqEc_HeraRPk",
  authDomain: "epic-latin.firebaseapp.com",
  projectId: "epic-latin",
  storageBucket: "epic-latin.firebasestorage.app", // Ensure this matches Console exactly
  messagingSenderId: "321050459278",
  appId: "1:321050459278:web:df00b3cf5b8befb0d55ddf",
  measurementId: "G-KEWLZ67Z61"
};

// Initialize Firebase (Singleton pattern to prevent double-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// EXPLICIT BUCKET CALL: This solves the 'not-found' mystery
// It forces the SDK to point to your specific bucket address
export const storage = getStorage(app, "gs://epic-latin.firebasestorage.app");

// @ts-ignore
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'epic-latin-prod';
