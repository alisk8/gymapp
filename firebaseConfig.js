// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAs017w3Y6s9zjeTSIbCJ7VP2xY1Q6qBfI",
  authDomain: "gym-app-a79f9.firebaseapp.com",
  projectId: "gym-app-a79f9",
  storageBucket: "gym-app-a79f9.appspot.com",
  messagingSenderId: "263607801498",
  appId: "1:263607801498:web:a72068aa12b924d4b57123",
  measurementId: "G-BNLRPNF78Z"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const firebase_auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Initialize storage
