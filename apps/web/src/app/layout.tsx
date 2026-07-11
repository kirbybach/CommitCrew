import type { Metadata } from "next";
import "./globals.css";
import DemoInit from "../components/DemoInit";

export const metadata: Metadata = {
  title: "CommitCrew",
  description: "A sanitized demo dashboard for an AI accountability bot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoInit />
        {children}
      </body>
    </html>
  );
}
