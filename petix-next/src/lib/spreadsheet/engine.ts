// Motor de fórmulas e grid do editor de planilhas — porta 1:1 das funções
// xlEvalCell/xlReplaceCellRefs/xlRangeValues do app.js original.
// Mesmas limitações do original: só colunas A–Z (uma letra) em referências,
// e fórmulas usam Function() para expressões aritméticas simples — mesmo
// modelo de confiança do app original (dado inserido pelo próprio usuário
// logado, roda só no navegador dele).

export const DEFAULT_ROWS = 50;
export const DEFAULT_COLS = 26;

export type SheetGrid = string[][];
export type SheetTab = { name: string; data: SheetGrid };

export const colLetter = (i: number) => String.fromCharCode(65 + i);
export const cellRef = (r: number, c: number) => `${colLetter(c)}${r + 1}`;

export function emptyGrid(rows: number, cols: number): SheetGrid {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

export function rangeValues(start: string, end: string, data: SheetGrid): string[] {
  const c1 = start.charCodeAt(0) - 65;
  const r1 = parseInt(start.slice(1), 10) - 1;
  const c2 = end.charCodeAt(0) - 65;
  const r2 = parseInt(end.slice(1), 10) - 1;
  const vals: string[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      vals.push(data[r]?.[c] ?? "");
    }
  }
  return vals;
}

export function replaceCellRefs(expr: string, data: SheetGrid): string {
  return expr.replace(/([A-Z]+)(\d+)/g, (_m, col: string, row: string) => {
    const c = col.charCodeAt(0) - 65;
    const r = parseInt(row, 10) - 1;
    const v = data[r]?.[c] ?? "";
    return isNaN(+v) ? `"${v}"` : String(+v);
  });
}

/** Avalia uma célula com o mesmo dialeto de fórmulas do app original. */
export function evalCell(val: string, data: SheetGrid): string | number {
  if (typeof val !== "string" || !val.startsWith("=")) return val;
  try {
    const expr = val.slice(1).toUpperCase().trim();

    const somaM = expr.match(/^SOMA\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (somaM) return rangeValues(somaM[1], somaM[2], data).reduce((a, b) => a + (+b || 0), 0);

    const mediaM = expr.match(/^MEDIA\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (mediaM) {
      const v = rangeValues(mediaM[1], mediaM[2], data).map((x) => +x || 0);
      return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : 0;
    }

    const maxM = expr.match(/^MAX\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (maxM) return Math.max(...rangeValues(maxM[1], maxM[2], data).map((x) => +x || 0));

    const minM = expr.match(/^MIN\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (minM) return Math.min(...rangeValues(minM[1], minM[2], data).map((x) => +x || 0));

    const contM = expr.match(/^CONT\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (contM) return rangeValues(contM[1], contM[2], data).filter((x) => x !== "").length;

    const seM = expr.match(/^SE\((.+),(.+),(.+)\)$/);
    if (seM) {
      const condVal = replaceCellRefs(seM[1], data);
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return (' + condVal + ")")();
      return result
        ? (replaceCellRefs(seM[2], data) as unknown as string)
        : (replaceCellRefs(seM[3], data) as unknown as string);
    }

    const evalStr = replaceCellRefs(expr, data);
    // eslint-disable-next-line no-new-func
    return Function('"use strict";return (' + evalStr + ")")();
  } catch {
    return "#ERRO";
  }
}
