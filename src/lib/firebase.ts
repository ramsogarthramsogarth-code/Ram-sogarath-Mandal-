import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC1OJzT4NKYy7J57HECC_Wq7XfQ2Hel6a4",
  authDomain: "proverbial-signifier-cd2jw.firebaseapp.com",
  projectId: "proverbial-signifier-cd2jw",
  storageBucket: "proverbial-signifier-cd2jw.firebasestorage.app",
  messagingSenderId: "788509004960",
  appId: "1:788509004960:web:117cd7849755c86c2b65c5"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided
export const db = getFirestore(app, "ai-studio-75e872a1-798a-4061-828f-7ddf1c2471c6");
export const auth = getAuth(app);
export default app;
