import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// This will be populated by the AI Studio setup tool
// @ts-ignore
import firebaseConfigLocal from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: "AIzaSyBP2NTJHjjxKtHwsAeJfFU27v1dzyp40Hw",
  authDomain: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd.firebaseapp.com",
  projectId: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd", // ESTE É O CORRETO
  storageBucket: "ai-studio-b9f262fe-d0eb-443c-8760-386f6d10f2cd.appspot.com",
  messagingSenderId: "1056584742352",
  appId: "1:1056584742352:web:7f8d6e5a4b3c2d1e0f9"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed-precondition: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support all of the features required to enable persistence
    console.warn('Firestore persistence unimplemented: Browser not supported');
  }
});

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();
