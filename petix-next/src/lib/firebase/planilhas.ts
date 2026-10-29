import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { SheetTab } from "@/lib/spreadsheet/engine";

export type SavedSheetMeta = {
  id: string;
  title: string;
  tabNames: string[];
  updatedAt: Date | null;
  rowCount: number;
};

const MAX_PAYLOAD = 950_000; // mesmo limite do app original (~950KB)

export async function saveSpreadsheet(params: {
  uid: string;
  docId: string | null;
  title: string;
  tabs: SheetTab[];
}): Promise<{ docId: string } | { error: string }> {
  const db = getFirebaseDb();
  const payload = JSON.stringify(params.tabs.map((t) => ({ name: t.name, data: t.data })));
  if (payload.length > MAX_PAYLOAD) {
    return { error: "Planilha muito grande (limite ~950KB). Reduza o conteúdo." };
  }

  const record = {
    uid: params.uid,
    title: params.title,
    tabNames: params.tabs.map((t) => t.name),
    dados: payload,
    updatedAt: serverTimestamp(),
  };

  try {
    if (params.docId) {
      await updateDoc(doc(db, "planilhas_v2", params.docId), record);
      return { docId: params.docId };
    } else {
      const ref = await addDoc(collection(db, "planilhas_v2"), {
        ...record,
        createdAt: serverTimestamp(),
      });
      return { docId: ref.id };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }
}

export async function listSpreadsheets(uid: string): Promise<SavedSheetMeta[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "planilhas_v2"), where("uid", "==", uid), limit(60));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data() as {
      title?: string;
      tabNames?: string[];
      updatedAt?: Timestamp;
      dados?: string;
    };
    let rowCount = 0;
    try {
      const parsed = JSON.parse(data.dados || "[]") as SheetTab[];
      rowCount = parsed[0]?.data?.length ?? 0;
    } catch {
      // ignora
    }
    return {
      id: d.id,
      title: data.title || "Sem título",
      tabNames: data.tabNames ?? [],
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      rowCount,
    };
  });
  items.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  return items;
}

export async function getSpreadsheet(
  id: string,
): Promise<{ title: string; tabs: SheetTab[] } | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "planilhas_v2", id));
  if (!snap.exists()) return null;
  const data = snap.data() as { title?: string; dados?: string };
  const tabs = JSON.parse(data.dados || "[]") as SheetTab[];
  return { title: data.title || "Sem título", tabs };
}

export async function deleteSpreadsheet(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "planilhas_v2", id));
}
