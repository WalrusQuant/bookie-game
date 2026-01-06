import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bookie - Sports Betting Simulator",
  description: "Run your own sports book. Set lines, manage risk, collect debts.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bookie",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} antialiased font-mono`}>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
