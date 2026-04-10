import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './config.js';
import { getCurrentUser } from './auth.js';

const TADS = 'tads';
const TADS_PRIVATE = 'tads_private';

// Devuelve la lista de TADs visibles (sin source, solo bytecode + spec).
export async function listarTads() {
  const q = query(collection(db, TADS), orderBy('nombre'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Devuelve un TAD por id (vista pública: sin source).
export async function getTad(id) {
  const snap = await getDoc(doc(db, TADS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Devuelve el source Python (solo accesible para docentes según security rules).
export async function getTadSource(id) {
  const snap = await getDoc(doc(db, TADS_PRIVATE, id));
  if (!snap.exists()) return null;
  return snap.data().source_py;
}

// Crea o actualiza un TAD. Recibe los datos del form + el bytecode ya compilado.
export async function guardarTad({
  id,
  nombre,
  descripcion,
  spec_md,
  ejemplos,
  python_class_name,
  source_py,
  bytecode_b64,
  python_version,
  pyodide_version,
}) {
  const user = getCurrentUser();
  if (!user) throw new Error('No autenticado');

  const tadId = id || doc(collection(db, TADS)).id;
  const publicData = {
    nombre,
    descripcion,
    spec_md,
    ejemplos,
    python_class_name,
    bytecode_b64,
    python_version,
    pyodide_version,
    updatedAt: serverTimestamp(),
    createdBy: user.uid,
  };

  if (!id) {
    publicData.createdAt = serverTimestamp();
    await setDoc(doc(db, TADS, tadId), publicData);
  } else {
    await updateDoc(doc(db, TADS, tadId), publicData);
  }

  await setDoc(doc(db, TADS_PRIVATE, tadId), {
    source_py,
    updatedAt: serverTimestamp(),
  });

  return tadId;
}

export async function eliminarTad(id) {
  await deleteDoc(doc(db, TADS, id));
  await deleteDoc(doc(db, TADS_PRIVATE, id));
}
