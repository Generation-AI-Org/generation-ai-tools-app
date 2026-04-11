import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="de" className={inter.variable}>
      <body className="bg-[#141414] text-[#F6F6F6] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
