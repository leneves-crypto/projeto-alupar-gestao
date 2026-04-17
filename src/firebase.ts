import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBP2NTJHjjxKtHwsAeJfFU27v1dzyp40Hw",
  authDomain: "gen-lang-client-0813022331.firebaseapp.com",
  projectId: "gen-lang-client-0813022331",
  storageBucket: "gen-lang-client-0813022331.firebasestorage.app",
  messagingSenderId: "1074424898743",
  appId: "1:1074424898743:web:c13179d463424a4264d932"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
