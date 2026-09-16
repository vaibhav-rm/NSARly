import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCnWv6eK_dMeQKMMu0W_LRmxCZB7iW88aA',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nsarly-bb3e3.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'nsarly-bb3e3',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nsarly-bb3e3.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '663582854457',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:663582854457:web:93819105b58fe6cb3f2ce8',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage Persistence
let auth: ReturnType<typeof getAuth>;

try {
  // Dynamically require React Native persistence from @firebase/auth/react-native if available
  const { getReactNativePersistence } = require('@firebase/auth/react-native');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e1) {
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e2) {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
