"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  ensureLocalAuthPersistence,
  getFirebaseAuth,
  getReadyFirebaseAuth,
  lockLocalAuthPersistence,
} from "@/lib/firebase";

const SESSION_HINT_KEY = "gemmint-auth-hint";

export interface AuthSessionHint {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: User | null;
  /** Fast hint from last successful login — used so the navbar shows Dashboard immediately. */
  sessionHint: AuthSessionHint | null;
  loading: boolean;
  /** True when we should treat the visitor as signed in for navigation CTAs. */
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSessionHint(): AuthSessionHint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSessionHint;
    if (!parsed?.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionHint(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(SESSION_HINT_KEY);
      return;
    }
    const hint: AuthSessionHint = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    window.localStorage.setItem(SESSION_HINT_KEY, JSON.stringify(hint));
  } catch {
    /* ignore quota */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionHint, setSessionHint] = useState<AuthSessionHint | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate hint immediately on the client so the header can show Dashboard
  // before Firebase finishes restoring IndexedDB.
  useEffect(() => {
    setSessionHint(readSessionHint());
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void (async () => {
      try {
        const auth = await getReadyFirebaseAuth();
        if (!active) return;

        const current = auth.currentUser;
        setUser(current);
        writeSessionHint(current);
        setSessionHint(current ? readSessionHint() : null);
        setLoading(false);

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          if (!active) return;
          setUser(nextUser);
          writeSessionHint(nextUser);
          setSessionHint(nextUser ? readSessionHint() : null);
          setLoading(false);
        });
      } catch (error) {
        console.error("Firebase auth init failed:", error);
        if (active) {
          setUser(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await ensureLocalAuthPersistence();
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    writeSessionHint(cred.user);
    setSessionHint(readSessionHint());
    setUser(cred.user);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      await ensureLocalAuthPersistence();
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      writeSessionHint(credential.user);
      setSessionHint(readSessionHint());
      setUser(credential.user);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    // Persistence is configured on initializeAuth — don't await setPersistence
    // here or browsers may block the popup (lost user gesture).
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(
      auth,
      provider,
      browserPopupRedirectResolver
    );
    // After the gesture completes, lock local persistence for next visits.
    void lockLocalAuthPersistence(auth);
    writeSessionHint(cred.user);
    setSessionHint(readSessionHint());
    setUser(cred.user);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    writeSessionHint(null);
    setSessionHint(null);
    setUser(null);
  }, []);

  const isSignedIn = Boolean(user) || (loading && Boolean(sessionHint));

  const value = useMemo(
    () => ({
      user,
      sessionHint,
      loading,
      isSignedIn,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [
      user,
      sessionHint,
      loading,
      isSignedIn,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
