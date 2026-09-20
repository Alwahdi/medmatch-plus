/**
 * استخراج نص السيرة الذاتية داخل متصفح المستخدم فقط.
 * لا يُرفع الملف الأصلي إلى أي خادم، ولا تُنفَّذ أي وحدات ماكرو أو سكربتات مضمّنة —
 * المكتبات المستخدمة تقرأ طبقة النص فقط. لا يُسجَّل أي جزء من المحتوى.
 */

export const CV_FILE_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxPdfPages: 40,
  minChars: 50,
  maxChars: 20000,
} as const;

export type CvExtractErrorCode =
  | "TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "LEGACY_DOC"
  | "PDF_ENCRYPTED"
  | "PDF_TOO_MANY_PAGES"
  | "CORRUPT"
  | "TOO_SHORT";

export class CvExtractError extends Error {
  code: CvExtractErrorCode;
  constructor(code: CvExtractErrorCode) {
    super(code);
    this.code = code;
    this.name = "CvExtractError";
  }
}

export type CvExtractResult = {
  text: string;
  /** عدد الأحرف قبل القصّ على الحد الأقصى (إن حدث قصّ). */
  originalLength: number;
  truncated: boolean;
};

export type CvFileKind = "pdf" | "docx" | "txt";

export function detectCvFileKind(file: File): CvFileKind | "doc" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".doc")) return "doc";
  return null;
}

/** إزالة المحارف الصفرية ومحارف التحكم مع الحفاظ على أسطر النص العربية والإنجليزية. */
export function normalizeCvText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

async function extractPdf(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default as string;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    const name = (e as { name?: string })?.name ?? "";
    if (name === "PasswordException") throw new CvExtractError("PDF_ENCRYPTED");
    throw new CvExtractError("CORRUPT");
  }

  if (doc.numPages > CV_FILE_LIMITS.maxPdfPages) {
    void task.destroy();
    throw new CvExtractError("PDF_TOO_MANY_PAGES");
  }

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(line);
    page.cleanup();
    onProgress?.(Math.round((i / doc.numPages) * 100));
  }
  void task.destroy();
  return parts.join("\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value ?? "";
  } catch {
    throw new CvExtractError("CORRUPT");
  }
}

export async function extractCvText(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<CvExtractResult> {
  if (file.size > CV_FILE_LIMITS.maxBytes) throw new CvExtractError("TOO_LARGE");
  const kind = detectCvFileKind(file);
  if (kind === "doc") throw new CvExtractError("LEGACY_DOC");
  if (!kind) throw new CvExtractError("UNSUPPORTED_TYPE");

  onProgress?.(5);
  let raw = "";
  if (kind === "txt") {
    raw = await file.text();
    onProgress?.(100);
  } else if (kind === "docx") {
    raw = await extractDocx(file);
    onProgress?.(100);
  } else {
    raw = await extractPdf(file, onProgress);
  }

  const text = normalizeCvText(raw);
  if (text.length < CV_FILE_LIMITS.minChars) throw new CvExtractError("TOO_SHORT");

  const truncated = text.length > CV_FILE_LIMITS.maxChars;
  return {
    text: truncated ? text.slice(0, CV_FILE_LIMITS.maxChars) : text,
    originalLength: text.length,
    truncated,
  };
}
