import { NextResponse } from "next/server";

function getPrismaErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isProofCvDatabaseNotReadyError(error: unknown) {
  const code = getPrismaErrorCode(error);
  return code === "P2021" || code === "P2022" || code === "P2024";
}

function isProofCvDatabaseUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = (error as { name?: unknown }).name;
  const message = (error as { message?: unknown }).message;

  return (
    name === "PrismaClientInitializationError" ||
    (typeof message === "string" && message.includes("Can't reach database server"))
  );
}

export function proofCvApiErrorResponse(error: unknown, fallbackMessage = "ProofCV workflow failed.") {
  if (isProofCvDatabaseNotReadyError(error)) {
    return NextResponse.json(
      {
        error:
          "ProofCV database is not ready. Apply the latest Prisma migration, then refresh and try again.",
      },
      { status: 503 }
    );
  }

  if (isProofCvDatabaseUnavailableError(error)) {
    return NextResponse.json(
      {
        error: "ProofCV database is unavailable. Check that Postgres is running, then refresh and try again.",
      },
      { status: 503 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message || fallbackMessage }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
