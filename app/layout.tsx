import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generation AI — KI-Tools für Studierende",
  description: "Die kuratierte KI-Tool-Bibliothek für Studierende im DACH-Raum. Finde die richtigen Tools für deinen Workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col bg-[#141414] text-[#F6F6F6] antialiased">
        {children}
      </body>
    </html>
  );
}
