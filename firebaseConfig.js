// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCW6PbismgIRMaZD7jfV4cUs4X_na6xg7k",
  authDomain: "team-masda.firebaseapp.com",
  projectId: "team-masda",
  storageBucket: "team-masda.firebasestorage.app",
  messagingSenderId: "580052564829",
  appId: "1:580052564829:web:9697b97a9fe93c041dc6b4",
  measurementId: "G-9PPYXR52D1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);