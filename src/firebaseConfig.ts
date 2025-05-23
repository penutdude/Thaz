import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC1qlt2Pn-Xbrlr5EJeoHDkEiJX0kXiZug",
  authDomain: "thazguthedath-family-3xn6o.firebaseapp.com",
  projectId: "thazguthedath-family-3xn6o",
  storageBucket: "thazguthedath-family-3xn6o.firebasestorage.app",
  messagingSenderId: "879712485938",
  appId: "1:879712485938:web:4b7dda9078be3a40f1f22b"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const authInstance: Auth = getAuth(app); // Explicitly typed instance
const storage: FirebaseStorage = getStorage(app);

export { db, authInstance as auth, storage, app }; // Exporting authInstance as auth
