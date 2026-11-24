import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const environmentConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL?.trim(),
};

// Firebase Web identifiers are public. Database access is enforced by Security Rules.
const productionConfig = {
  apiKey: 'AIzaSyCnI0b1te0Afnu-OA0s5zyzqLEMkDnq-gE',
  authDomain: 'aprevo-1e150.firebaseapp.com',
  projectId: 'aprevo-1e150',
  appId: '1:890102660599:web:c9e396c6e71a7bb82782f2',
  databaseURL: 'https://aprevo-1e150-default-rtdb.firebaseio.com',
};

const config = Object.values(environmentConfig).every(Boolean)
  ? environmentConfig
  : import.meta.env.PROD && window.location.hostname === 'aprevo.vercel.app'
    ? productionConfig
    : null;

const app = config ? initializeApp(config) : null;
export const firebaseAuth = app ? getAuth(app) : null;
export const firebaseDatabase = app ? getDatabase(app) : null;
