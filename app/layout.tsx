import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astral — Your Chart Knows You",
  description: "An AI companion that knows your natal chart as deeply as you know yourself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ height: "100%", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
