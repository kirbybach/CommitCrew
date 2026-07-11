import type { Metadata } from "next";
import "./globals.css";
import DemoInit from "../components/DemoInit";

export const metadata: Metadata = {
  title: "CommitCrew",
  description: "A sanitized demo dashboard for an AI accountability bot.",
};

const themeInitScript = `
(() => {
  try {
    const requestedTheme = new URLSearchParams(window.location.search).get('theme');
    const savedTheme = localStorage.getItem('commitcrew-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = requestedTheme === 'dark' || requestedTheme === 'light'
      ? requestedTheme
      : savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    if (requestedTheme === 'dark' || requestedTheme === 'light') {
      localStorage.setItem('commitcrew-theme', requestedTheme);
    }
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <DemoInit />
        {children}
      </body>
    </html>
  );
}
