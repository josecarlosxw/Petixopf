# PetixOps

Painel web para centralizar operações administrativas do dia a dia: conversão
de códigos de produtos entre sistemas, divisão e renomeação automática de
PDFs de nota fiscal (com OCR), mesclagem de PDFs, planilhas com fórmulas e um
histórico unificado de tudo isso.

> **Nota sobre esta versão pública:** este repositório é uma versão de
> portfólio do projeto. Todos os dados de exemplo (códigos de produtos,
> preços, nomes de empresas) são **fictícios**, e as credenciais de backend
> foram removidas. Veja a seção [Segurança](#segurança).

## Sobre o projeto

Em operações administrativas com grande volume de documentos e conferências
manuais, é comum que cada tarefa vire uma ferramenta separada: uma planilha
para um cálculo, um site para converter um código, outro processo manual
para separar páginas de um PDF. O PetixOps nasceu para resolver isso —
reunir essas ferramentas do dia a dia em um único painel, com interface
consistente e sem depender de processos manuais repetitivos.

O projeto começou como um site estático (HTML/CSS/JS) e foi totalmente
migrado para Next.js (App Router) + React + TypeScript, preservando a lógica
de negócio original de cada ferramenta.

## Funcionalidades

- **Painel** — visão geral com KPIs, categorias e acesso rápido às ferramentas.
- **Consulta de códigos** — converte códigos entre dois sistemas de catálogo
  (fornecedor ↔ interno) por busca única ou em lote, com histórico automático
  das consultas.
- **Split NF-e** — divide um PDF de nota fiscal por página, intervalo
  personalizado ou lote, extraindo o número da nota via texto nativo do PDF
  ou, quando necessário, via OCR (Tesseract.js) — e renomeia cada parte
  automaticamente. Gera um `.zip` com o resultado.
- **Colisão (merge de PDFs)** — mescla múltiplos arquivos PDF em um único
  documento.
- **Meus PDFs** — visualizador de PDF com upload, listagem e armazenamento.
- **Planilhas** — editor de planilhas em grade, com fórmulas (`SOMA`,
  `MEDIA`, `MAX`, `MIN`, `CONT`, `SE`) e operações aritméticas, múltiplas
  abas, importação/exportação via SheetJS e salvamento automático.
- **Histórico** — registro centralizado de consultas e PDFs processados.
- **Comunidade** — feed em tempo real para avisos e comunicados da equipe.

## Tecnologias utilizadas

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- **Firebase** (Auth anônimo + Firestore) como backend
- **pdf-lib** e **pdfjs-dist** para manipulação/leitura de PDF
- **Tesseract.js** para OCR
- **JSZip** para geração de arquivos `.zip`
- **SheetJS (xlsx)** para importação/exportação de planilhas
- **Lucide** para ícones

## Estrutura do projeto

```
src/
  app/
    (app)/            # rotas do painel — uma pasta por ferramenta
      consulta/        planilhas/       colisao/
      split-nfe/        pdfs/            historico/
      comunidade/
    layout.tsx, globals.css
  components/
    layout/            # shell, sidebar, topbar, tema, command palette
    painel/             # cards e widgets do painel inicial
    tools/               # componentes específicos das ferramentas (PDF, planilhas)
    ui/                   # componentes de base (button, card, dialog, etc.)
  lib/
    data/                # dados de exemplo (fictícios nesta versão)
    firebase/             # camada de acesso ao Firestore, por domínio
    pdf/                   # extração de NF-e, OCR, configuração do PDF.js
    spreadsheet/             # motor de fórmulas da planilha
  hooks/                     # hooks compartilhados (ex.: autenticação anônima)
```

Cada ferramenta tem sua própria rota em `app/(app)/`, com a lógica de UI na
página e a lógica de dados isolada em `lib/`, facilitando manutenção e
testes independentes.

## Como executar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# preencha com as credenciais do seu próprio projeto Firebase (veja abaixo)

# 3. Rodar em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Para usar as ferramentas que dependem de backend (Histórico, Comunidade,
Meus PDFs, Planilhas), crie um projeto no [Firebase](https://firebase.google.com/),
ative **Authentication → Login anônimo** e **Firestore Database**, e
preencha as variáveis `NEXT_PUBLIC_FIREBASE_*` no `.env.local` com a
configuração pública do seu próprio projeto.

```bash
npm run build   # build de produção
npm run lint     # checagem de lint
```

## Segurança

Esta é a versão pública do projeto, preparada especificamente para portfólio:

- Nenhuma credencial, chave de API ou token está incluída no repositório —
  `.env.local` é ignorado pelo Git e `.env.example` traz apenas o template.
- Os dados de exemplo usados na ferramenta de Consulta de códigos são
  **totalmente fictícios** (códigos, descrições e preços gerados
  artificialmente), sem qualquer relação com dados reais de produtos,
  fornecedores ou clientes.
- Referências a empresas, times ou sistemas internos reais foram
  removidas/generalizadas.
- A configuração pública do Firebase (`NEXT_PUBLIC_FIREBASE_*`) é, por
  natureza, exposta no navegador em qualquer app client-side — a segurança
  real dos dados depende das regras do Firestore, não do sigilo dessas
  variáveis.

## Demonstração

🔗 *(adicionar aqui o link da aplicação publicada, se houver)*

## Screenshots

*(adicionar aqui capturas de tela do Painel, Consulta, Split NF-e e Planilhas)*

## Aprendizados

Este projeto foi uma oportunidade de aplicar, na prática:

- Desenvolvimento frontend moderno com **Next.js/React/TypeScript** e
  arquitetura de componentes reutilizáveis.
- Migração de um projeto legado (HTML/CSS/JS puro) para uma stack tipada,
  preservando regras de negócio existentes.
- Manipulação de arquivos no navegador: leitura, divisão e mesclagem de
  PDFs (`pdf-lib`, `pdfjs-dist`).
- Processamento de texto e **OCR no client-side** (`Tesseract.js`) para
  extrair dados estruturados de documentos escaneados.
- Organização e transformação de dados tabulares (planilhas com motor de
  fórmulas próprio, import/export via SheetJS).
- Modelagem de dados e integração com um backend real (Firebase
  Auth/Firestore), incluindo regras de autorização por usuário.
- Tratamento de erros, estados de carregamento e feedback visual para
  melhorar a experiência do usuário.
- Cuidados de responsividade, acessibilidade básica e Content Security
  Policy (`netlify.toml`).
- Preparação de um projeto real para publicação segura como portfólio:
  auditoria de segredos, anonimização de dados e documentação técnica.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.
