import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  FileOutput,
  FilesIcon,
  History,
  Users,
  Table2,
  FileText,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  description: string;
};

export const NAV_GERAL: NavItem[] = [
  {
    href: "/",
    label: "Painel",
    icon: LayoutDashboard,
    description: "Visão geral do PetixOps",
  },
];

export const NAV_FERRAMENTAS: NavItem[] = [
  {
    href: "/consulta",
    label: "Consulta",
    icon: Search,
    badge: "55",
    description: "Converter código Fornecedor em código Petix",
  },
  {
    href: "/split-nfe",
    label: "Split NF-e",
    icon: FileOutput,
    badge: "OCR",
    description: "Dividir PDF de NF-e por página, intervalo ou lote",
  },
  {
    href: "/colisao",
    label: "Colisão",
    icon: FilesIcon,
    badge: "PDF",
    description: "Mesclar múltiplos PDFs em um único arquivo",
  },
  {
    href: "/historico",
    label: "Histórico",
    icon: History,
    description: "Consultas e divisões de PDF anteriores",
  },
  {
    href: "/comunidade",
    label: "Comunidade",
    icon: Users,
    description: "Feed de avisos e discussões da equipe",
  },
];

export const NAV_DOCUMENTOS: NavItem[] = [
  {
    href: "/planilhas",
    label: "Planilhas",
    icon: Table2,
    description: "Editor de planilhas com fórmulas",
  },
  {
    href: "/pdfs",
    label: "Meus PDFs",
    icon: FileText,
    description: "Visualizar e salvar PDFs",
  },
];

export const NAV_TOPBAR: NavItem[] = [
  NAV_GERAL[0],
  NAV_FERRAMENTAS[0],
  NAV_FERRAMENTAS[1],
  NAV_FERRAMENTAS[2],
  NAV_FERRAMENTAS[3],
];

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GERAL,
  ...NAV_FERRAMENTAS,
  ...NAV_DOCUMENTOS,
];
