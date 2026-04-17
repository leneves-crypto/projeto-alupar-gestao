import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "COLE_AQUI_A_SUA_API_KEY",
  authDomain: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd.firebaseapp.com",
  projectId: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd",
  storageBucket: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd.appspot.com",
  messagingSenderId: "COLE_AQUI_O_SENDER_ID",
  appId: "COLE_AQUI_O_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
