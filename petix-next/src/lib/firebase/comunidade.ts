import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export type ComunidadeTipo = "aviso" | "recado" | "atualizacao" | "comunicado";

export type ComunidadePost = {
  id: string;
  text: string;
  type: ComunidadeTipo;
  uid: string;
  authorName: string;
  createdAt: Date | null;
};

export const COMM_LABELS: Record<ComunidadeTipo, string> = {
  aviso: "📢 Aviso",
  recado: "💬 Recado",
  atualizacao: "🔄 Atualização",
  comunicado: "📌 Comunicado",
};

export function listenComunidade(
  onData: (posts: ComunidadePost[]) => void,
  onError: (err: unknown) => void,
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "comunidade"),
    orderBy("createdAt", "desc"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => {
      const posts = snap.docs.map((d) => {
        const data = d.data() as {
          text?: string;
          type?: ComunidadeTipo;
          uid?: string;
          authorName?: string;
          createdAt?: Timestamp;
        };
        return {
          id: d.id,
          text: data.text ?? "",
          type: data.type ?? "recado",
          uid: data.uid ?? "",
          authorName: data.authorName || "Convidado",
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
        };
      });
      onData(posts);
    },
    onError,
  );
}

// Anônimo não tem email/displayName (bug corrigido na migração — ver
// observação sobre login anônimo). Uso "Convidado" como nome de exibição.
export async function postComunidade(
  uid: string,
  text: string,
  type: ComunidadeTipo,
) {
  const db = getFirebaseDb();
  await addDoc(collection(db, "comunidade"), {
    text,
    type,
    uid,
    authorName: "Convidado",
    createdAt: serverTimestamp(),
  });
}

export async function editComunidade(uid: string, id: string, novoTexto: string) {
  const db = getFirebaseDb();
  const ref = doc(db, "comunidade", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().uid !== uid) {
    throw new Error("Você não pode editar esta publicação.");
  }
  await updateDoc(ref, { text: novoTexto });
}

export async function deleteComunidade(uid: string, id: string) {
  const db = getFirebaseDb();
  const ref = doc(db, "comunidade", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().uid !== uid) {
    throw new Error("Você não pode apagar esta publicação.");
  }
  await deleteDoc(ref);
}
