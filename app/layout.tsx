import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { ModalProvider } from "@/components/modal-provider";
import { ToasterProvider } from "@/components/toaster-provider";

export const metadata: Metadata = {
  title: "ProofCV | AI CV tailoring for the exact job you want",
  description:
    "Tell ProofCV the role. Add your CV or start from scratch. Get a tailored one-page CV using your real experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider> 
      <html lang="en" className="scroll-smooth">
        <body className="antialiased">
          
          <ModalProvider />
          <ToasterProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
