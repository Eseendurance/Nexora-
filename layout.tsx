import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Nexora AI — Self-Hosted Business Intelligence OS",
  description:
    "AI chat, content, social media, business development, marketing, presentations, and website-to-video production.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#06060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
