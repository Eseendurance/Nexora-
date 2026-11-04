import type { Metadata, Viewport } from "next";
import PWARegister from "@/components/PWARegister";
import ThemeProvider from "./theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora AI",
  description: "Your Self-Hosted AI Business Operating System",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#090a12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
