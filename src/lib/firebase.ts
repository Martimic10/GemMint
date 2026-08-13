import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore as getFirestoreDb, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase config: ${missing.join(", ")}. Add them to .env.local.`
    );
  }
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let persistenceLocked: Promise<void> | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase app is only available in the browser.");
  }

  assertConfig();

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
}

/**
 * Single Auth instance with durable local persistence so sessions survive
 * closing the tab/browser.
 */
export function getFirebaseAuth() {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser.");
  }

  if (auth) return auth;

  const firebaseApp = getFirebaseApp();

  try {
    auth = initializeAuth(firebaseApp, {
      // Prefer IndexedDB, fall back to localStorage automatically.
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Already initialized (Strict Mode / Fast Refresh)
    auth = getAuth(firebaseApp);
  }

  return auth;
}

/** Firestore instance for per-user credits, grades, and reports. */
export function getFirestore() {
  if (typeof window === "undefined") {
    throw new Error("Firestore is only available in the browser.");
  }
  if (!db) {
    db = getFirestoreDb(getFirebaseApp());
  }
  return db;
}

/**
 * Lock in long-lived persistence AFTER the current session has been restored.
 * Calling setPersistence before authStateReady can wipe a restoring login.
 */
export async function lockLocalAuthPersistence(instance?: Auth) {
  const authInstance = instance ?? getFirebaseAuth();
  if (!persistenceLocked) {
    persistenceLocked = setPersistence(authInstance, browserLocalPersistence).catch(
      (error) => {
        console.warn("Could not lock Firebase auth persistence:", error);
      }
    );
  }
  return persistenceLocked;
}

/**
 * Resolves after Firebase has restored any persisted session.
 * Do not call setPersistence before this — it races the restore.
 */
export async function getReadyFirebaseAuth() {
  const instance = getFirebaseAuth();
  await instance.authStateReady();
  // Persist the restored user (and future sign-ins) to local storage.
  await lockLocalAuthPersistence(instance);
  return instance;
}

/** Call before email/password sign-in so the new session is durable. */
export async function ensureLocalAuthPersistence() {
  const instance = getFirebaseAuth();
  // If auth isn't ready yet, wait — then lock persistence.
  await instance.authStateReady();
  await lockLocalAuthPersistence(instance);
}

/** @deprecated Use getReadyFirebaseAuth */
export function getPersistentFirebaseAuth() {
  return getReadyFirebaseAuth();
}

/** @deprecated Persistence is always local now. */
export async function applyAuthPersistence(_remember = true) {
  await ensureLocalAuthPersistence();
}
