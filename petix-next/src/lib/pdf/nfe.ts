// Extração do número de NF-e a partir de texto (nativo ou OCR) e parsing de
// intervalos de página — 1:1 com extractNFe/parseRanges do app.js original.

export function extractNFe(text: string): string | null {
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/[Oo]/g, "0")
    .replace(/[Il]/g, "1");

  const regex = /N[°º.:]?\s*0*(\d{4,5})/gi;
  let match: RegExpExecArray | null;
  const candidatos: string[] = [];

  while ((match = regex.exec(clean)) !== null) {
    const num = match[1].replace(/^0+/, "");
    if (num.length >= 4 && num.length <= 5) candidatos.push(num);
  }

  return candidatos.length > 0 ? candidatos[0] : null;
}

export function parseRanges(str: string, maxPage: number): [number, number][] {
  const segments: [number, number][] = [];
  for (const part of str.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (isNaN(a) || isNaN(b)) throw new Error(`Intervalo inválido: "${part}"`);
      if (a < 1 || b < a || b > maxPage) throw new Error(`Fora dos limites: "${part}"`);
      segments.push([a, b]);
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > maxPage) throw new Error(`Página inválida: "${part}"`);
      segments.push([n, n]);
    }
  }
  return segments;
}

export function formatBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 ** 2) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 ** 2).toFixed(1) + " MB";
}
