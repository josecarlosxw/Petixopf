"use client";
import * as React from "react";
import { Megaphone, MessageSquare, RefreshCcw, Pin, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { useShell } from "@/components/layout/shell-context";
import {
  listenComunidade,
  postComunidade,
  editComunidade,
  deleteComunidade,
  COMM_LABELS,
  type ComunidadePost,
  type ComunidadeTipo,
} from "@/lib/firebase/comunidade";

const FILTERS: { value: "todos" | ComunidadeTipo; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aviso", label: "Avisos" },
  { value: "recado", label: "Recados" },
  { value: "atualizacao", label: "Atualizações" },
  { value: "comunicado", label: "Comunicados" },
];

const TYPE_ICON: Record<ComunidadeTipo, React.ReactNode> = {
  aviso: <Megaphone className="size-3.5" />,
  recado: <MessageSquare className="size-3.5" />,
  atualizacao: <RefreshCcw className="size-3.5" />,
  comunicado: <Pin className="size-3.5" />,
};

export default function ComunidadePage() {
  const { user } = useAnonymousAuth();
  const { setCommCount } = useShell();
  const [posts, setPosts] = React.useState<ComunidadePost[]>([]);
  const [filter, setFilter] = React.useState<"todos" | ComunidadeTipo>("todos");
  const [text, setText] = React.useState("");
  const [type, setType] = React.useState<ComunidadeTipo>("recado");
  const [posting, setPosting] = React.useState(false);

  React.useEffect(() => {
    const unsub = listenComunidade(
      (data) => {
        setPosts(data);
        setCommCount(data.length);
      },
      (err) => console.error("Firestore erro:", err),
    );
    return () => unsub();
  }, [setCommCount]);

  async function handlePost() {
    const msg = text.trim();
    if (!msg || !user) return;
    setPosting(true);
    try {
      await postComunidade(user.uid, msg, type);
      setText("");
    } catch (e) {
      alert("Erro ao publicar. Tente novamente.");
      console.error(e);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user || !confirm("Apagar esta publicação?")) return;
    try {
      await deleteComunidade(user.uid, id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao apagar.");
    }
  }

  async function handleEdit(post: ComunidadePost) {
    if (!user) return;
    const novo = prompt("Editar publicação:", post.text);
    if (novo === null || novo.trim() === "") return;
    try {
      await editComunidade(user.uid, post.id, novo.trim());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao editar.");
    }
  }

  const visiblePosts = posts.filter((p) => filter === "todos" || p.type === filter);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">Comunidade</h1>

      <Card className="flex flex-col gap-3 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um recado para a equipe..."
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-muted p-3 text-sm outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <div className="flex items-center justify-between gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ComunidadeTipo)}
            className="rounded-md border border-border bg-muted px-2 py-1.5 text-sm outline-none"
          >
            {(Object.keys(COMM_LABELS) as ComunidadeTipo[]).map((t) => (
              <option key={t} value={t}>
                {COMM_LABELS[t]}
              </option>
            ))}
          </select>
          <Button onClick={handlePost} disabled={posting || !text.trim()}>
            {posting ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f.value
                ? "border-primary/30 bg-primary/10 text-accent-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visiblePosts.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma publicação por aqui ainda.
          </Card>
        )}
        {visiblePosts.map((post) => {
          const isOwner = user && user.uid === post.uid;
          return (
            <Card key={post.id} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 text-faint">{TYPE_ICON[post.type]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{post.authorName}</span>
                  <span>
                    {post.createdAt?.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOwner && (
                    <span className="ml-auto flex gap-1">
                      <button
                        onClick={() => handleEdit(post)}
                        className="rounded p-1 text-faint hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded p-1 text-faint hover:bg-status-red/10 hover:text-status-red"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm">{post.text}</p>
                <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {COMM_LABELS[post.type]}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
