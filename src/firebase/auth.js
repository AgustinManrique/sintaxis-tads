import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config.js';
import { ROLES } from '../constants.js';

// Estado de sesión cacheado en memoria
let currentUser = null;
let currentProfile = null;
const listeners = new Set();

function notify() {
  for (const cb of listeners) cb({ user: currentUser, profile: currentProfile });
}

export function onAuthChanged(callback) {
  listeners.add(callback);
  callback({ user: currentUser, profile: currentProfile });
  return () => listeners.delete(callback);
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    currentProfile = await loadOrCreateProfile(user);
  } else {
    currentProfile = null;
  }
  notify();
});

async function loadOrCreateProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { uid: user.uid, ...snap.data() };
  }
  const profile = {
    email: user.email,
    nombre: user.displayName || user.email.split('@')[0],
    role: ROLES.ALUMNO,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return { uid: user.uid, ...profile };
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registrar(email, password, nombre) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // El perfil se crea automáticamente vía onAuthStateChanged,
  // pero forzamos el nombre acá para no depender del displayName.
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    nombre,
    role: ROLES.ALUMNO,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function isDocente() {
  return currentProfile?.role === ROLES.DOCENTE;
}
