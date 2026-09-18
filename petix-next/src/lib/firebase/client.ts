import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicialização PREGUIÇOSA — de propósito.
// Next.js executa componentes "use client" uma vez no servidor durante o
// build (pré-renderização), mesmo eles só rodando de fato no navegador.
// Se initializeApp()/getAuth()/getFirestore() rodassem no topo do módulo
// (como antes), isso disparava durante o build, e sem as env vars do
// Firebase configuradas no ambiente de build (ex: Netlify), a build inteira
// quebrava com "Firebase: Error (auth/invalid-api-key)". Com getters
// preguiçosos, esse código só roda quando efetivamente chamado a partir de
// um useEffect ou de um event handler — ou seja, só no navegador, depois do
// deploy, quando as env vars de runtime já existem.
let _app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp {
  if (!_app) _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

let _db: Firestore | null = null;
export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

// Login anônimo automático — o readme do projeto original descrevia esse
// comportamento, mas a chamada real estava faltando no firebase.js. Replico
// aqui a intenção (preserva as Firestore rules que exigem request.auth != null,
// sem distinguir usuários entre si).
let anonSignInStarted = false;
export function ensureAnonymousAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      } else if (!anonSignInStarted) {
        anonSignInStarted = true;
        signInAnonymously(auth).catch((err) => {
          unsub();
          reject(err);
        });
      }
    });
  });
}
