// ════════════════════════════════════════════════════════════
//  firebase.js — Firebase başlatma + auth/firestore yardımcıları
//  CDN'den ES modülleri (build adımı yok). Dinamik import edilir;
//  yüklenemezse app.js yerel moda düşer.
// ════════════════════════════════════════════════════════════
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInAnonymously, signOut,
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc,
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB7M6qm3NEshbBNMxrcBPq-Y6TExd4I_xk',
  authDomain: 'ravenfit-3.firebaseapp.com',
  projectId: 'ravenfit-3',
  storageBucket: 'ravenfit-3.firebasestorage.app',
  messagingSenderId: '586596707620',
  appId: '1:586596707620:web:6a890720a325e4c04257b1',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth };
export function onAuth(cb) { return onAuthStateChanged(auth, cb); }
export function signUp(email, pass) { return createUserWithEmailAndPassword(auth, email, pass); }
export function signIn(email, pass) { return signInWithEmailAndPassword(auth, email, pass); }
export function signInGuest() { return signInAnonymously(auth); }
export function logOut() { return signOut(auth); }

// Kullanıcının bulut verisini getir (yoksa null)
export async function pullUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
// Kullanıcının bulut verisini yaz (birleştir)
export function pushUserData(uid, data) {
  return setDoc(doc(db, 'users', uid), data, { merge: true });
}
