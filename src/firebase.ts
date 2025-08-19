// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your Firebase project configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyD0NwMYQawU0r-SnYQlTO-LDYez_mdtOco",
//   authDomain: "casaciordas.firebaseapp.com",
//   projectId: "casaciordas",
//   storageBucket: "casaciordas.firebasestorage.app",
//   messagingSenderId: "279505031605",
//   appId: "1:279505031605:web:c967eeef0addd2370909fc",
//   databaseURL:
//     "https://casaciordas-default-rtdb.europe-west1.firebasedatabase.app/",
// };
const firebaseConfig = {
  apiKey: "AIzaSyCGRphUwuWwQpbHktR70tMXNYs6fZv_JlI",
  authDomain: "menutempalte.firebaseapp.com",
  projectId: "menutempalte",
  storageBucket: "menutempalte.firebasestorage.app",
  messagingSenderId: "500961000112",
  appId: "1:500961000112:web:a6fe75b2e65d484cf05975",
  databaseURL:
    "https://menutempalte-default-rtdb.europe-west1.firebasedatabase.app/",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const realtimeDB = getDatabase(app);
export const storage = getStorage(app);

export default app;
