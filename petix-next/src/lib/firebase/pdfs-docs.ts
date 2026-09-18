import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export type SavedPdfMeta = {
  id: string;
  nome: string;
  tamanho: number;
  paginas: number;
  createdAt: Date | null;
};

// Atenção: Firestore tem limite de ~1MB por documento. PDFs cujo base64
// ultrapasse isso falham ao salvar — isso já era assim no app original
// (nenhuma validação de tamanho existia em pdfDocSave). Mantive o
// comportamento idêntico; se quiser, posso adicionar um aviso de tamanho.
export async function savePdfDoc(
  uid: string,
  file: { nome: string; tamanho: number; paginas: number; base64: string },
) {
  const db = getFirebaseDb();
  await addDoc(collection(db, "pdfs_docs"), {
    uid,
    ...file,
    createdAt: serverTimestamp(),
  });
}

export async function listPdfDocs(uid: string): Promise<SavedPdfMeta[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "pdfs_docs"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as {
      nome?: string;
      tamanho?: number;
      paginas?: number;
      createdAt?: Timestamp;
    };
    return {
      id: d.id,
      nome: data.nome ?? "",
      tamanho: data.tamanho ?? 0,
      paginas: data.paginas ?? 0,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
    };
  });
}

export async function getPdfDocBase64(id: string): Promise<{ nome: string; base64: string }> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "pdfs_docs", id));
  const data = snap.data() as { nome?: string; base64?: string } | undefined;
  return { nome: data?.nome ?? "documento.pdf", base64: data?.base64 ?? "" };
}

export async function deletePdfDoc(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "pdfs_docs", id));
}

export function base64ToBlob(base64: string): Blob {
  const bin = atob(base64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf as BlobPart], { type: "application/pdf" });
}

export async function fileToBase64(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function formatSize(bytes: number): string {
  return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + "MB" : (bytes / 1024).toFixed(1) + "KB";
}
