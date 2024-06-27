import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
