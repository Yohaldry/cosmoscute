import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQ9Ei9AK-rmllHRqoE-qPLLxTiAeOZyno",
  authDomain: "usuarios-barberos.firebaseapp.com",
  databaseURL: "https://usuarios-barberos.firebaseio.com",
  projectId: "usuarios-barberos",
  storageBucket: "usuarios-barberos.firebasestorage.app",
  messagingSenderId: "524028905050",
  appId: "1:524028905050:web:b90e371ba1f044c7283a63",
  measurementId: "G-8Z06GET19Q"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);