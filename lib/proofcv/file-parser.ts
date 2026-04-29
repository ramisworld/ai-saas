import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { MAX_CV_UPLOAD_BYTES } from "@/lib/proofcv/schemas";

export function validateCvFile(file: File) {
  const filename = file.name.toLowerCase();
  const contentType = file.type.toLowerCase();
  const isDocx = filename.endsWith(".docx") || contentType.includes("wordprocessingml");
  const isPdf = filename.endsWith(".pdf") || contentType.includes("pdf");

  if (!isDocx && !isPdf) {
    throw new Error("Upload your CV as a PDF or DOCX file.");
  }

  if (file.size > MAX_CV_UPLOAD_BYTES) {
    throw new Error("Your CV file is too large. Upload a PDF or DOCX under 5MB.");
  }
}

export async function extractTextFromProofCvUpload(file: File) {
  validateCvFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = file.name.toLowerCase();
  const contentType = file.type.toLowerCase();

  if (filename.endsWith(".docx") || contentType.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
