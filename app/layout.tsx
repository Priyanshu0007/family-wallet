import type { Metadata, Viewport } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({ 
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap"
});

const spaceMono = Space_Mono({ 
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Family Wallet",
  description: "Secure, offline-first family wallet application.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Family Wallet",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${spaceMono.variable} dark`}>
      <body className="antialiased bg-background text-text-primary selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
