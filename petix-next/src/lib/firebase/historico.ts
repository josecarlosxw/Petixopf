import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export type HistoricoConsultaEntry = {
  id: string;
  query: string;
  codes: string[];
  found: number;
  time: Date;
};

export type HistoricoPdfEntry = {
  id: string;
  arquivo: string;
  totalPaginas: number;
  partes: number;
  encontrados: number;
  naoEncontrados: number;
  arquivos: string[];
  time: Date;
};

export async function addHistoricoConsulta(
  uid: string,
  entry: { query: string; codes: string[]; found: number },
) {
  const db = getFirebaseDb();
  await addDoc(collection(db, "historico"), {
    uid,
    query: entry.query,
    codes: entry.codes,
    found: entry.found,
    createdAt: serverTimestamp(),
  });
}

export async function listHistoricoConsulta(
  uid: string,
): Promise<HistoricoConsultaEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "historico"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as {
      query: string;
      codes?: string[];
      found?: number;
      createdAt?: Timestamp;
    };
    return {
      id: d.id,
      query: data.query,
      codes: data.codes ?? [],
      found: data.found ?? 0,
      time: data.createdAt ? data.createdAt.toDate() : new Date(),
    };
  });
}

export async function clearHistoricoConsulta(uid: string) {
  const db = getFirebaseDb();
  const q = query(collection(db, "historico"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function addHistoricoPdf(
  uid: string,
  entry: {
    arquivo: string;
    totalPaginas: number;
    partes: number;
    encontrados: number;
    naoEncontrados: number;
    arquivos: string[];
  },
) {
  const db = getFirebaseDb();
  await addDoc(collection(db, "historico_pdf"), {
    uid,
    ...entry,
    createdAt: serverTimestamp(),
  });
}

export async function listHistoricoPdf(
  uid: string,
): Promise<HistoricoPdfEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "historico_pdf"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as {
      arquivo: string;
      totalPaginas: number;
      partes: number;
      encontrados: number;
      naoEncontrados: number;
      arquivos?: string[];
      createdAt?: Timestamp;
    };
    return {
      id: d.id,
      arquivo: data.arquivo,
      totalPaginas: data.totalPaginas,
      partes: data.partes,
      encontrados: data.encontrados,
      naoEncontrados: data.naoEncontrados,
      arquivos: data.arquivos ?? [],
      time: data.createdAt ? data.createdAt.toDate() : new Date(),
    };
  });
}

export async function clearHistoricoPdf(uid: string) {
  const db = getFirebaseDb();
  const q = query(collection(db, "historico_pdf"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
