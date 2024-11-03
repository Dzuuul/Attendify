// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAA1oP8qThDsZU3m001k6RPq4CxYK08jsA",
  authDomain: "iss-project-97e11.firebaseapp.com",
  projectId: "iss-project-97e11",
  storageBucket: "iss-project-97e11.appspot.com",
  messagingSenderId: "791760337496",
  appId: "1:791760337496:web:a470b553de03647c1a282d",
  measurementId: "G-LN65R7WT16"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

const analytics = getAnalytics(app);