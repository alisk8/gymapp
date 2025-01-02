// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpvFfKTbFhknpS_lrYdaL_PSEsMZ3VC7k",
  authDomain: "twotwentyfive-3acb1.firebaseapp.com",
  projectId: "twotwentyfive-3acb1",
  storageBucket: "twotwentyfive-3acb1.firebasestorage.app",
  messagingSenderId: "640231718439",
  appId: "1:640231718439:web:0a6b9382b95d31035ed802",
  measurementId: "G-DN7K4XVFPE"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//export const firebase_auth = getAuth(app);


// Initialize Firebase Auth with AsyncStorage for persistence
export const firebase_auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});


export const db = getFirestore(app);
export const storage = getStorage(app); // Initialize storage