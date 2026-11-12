import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pirma Lang — Kami na bahala sa form",
  description: "Scan your IDs once, review what is missing, and download a ready-to-sign PDF. Your personal record stays in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
