

// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrphDFcMuFXxtt4MCm2z-Fn4OU4YTXIHw",
  authDomain: "todoapp-db2a3.firebaseapp.com",
  projectId: "todoapp-db2a3",
  storageBucket: "todoapp-db2a3.firebasestorage.app",
  messagingSenderId: "584812952471",
  appId: "1:584812952471:web:942bb653637d76245ee2d2",
  measurementId: "G-RPXDT98XNR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
