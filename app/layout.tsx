import type { Metadata } from "next";
import MixpanelProvider from "@/components/MixpanelProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seraphova — Your Chart Knows You",
  description: "An AI that knows your natal chart as deeply as you know yourself.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  );
}
