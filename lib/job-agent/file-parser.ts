import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function extractTextFromUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("CV upload is too large. Use a file under 5MB for the MVP.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = file.name.toLowerCase();
  const contentType = file.type.toLowerCase();

  if (filename.endsWith(".txt") || contentType.includes("text/plain")) {
    return buffer.toString("utf8");
  }

  if (filename.endsWith(".docx") || contentType.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (filename.endsWith(".pdf") || contentType.includes("pdf")) {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Unsupported CV file type. Upload a PDF, DOCX, or TXT file.");
}
