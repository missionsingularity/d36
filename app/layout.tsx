import type { Metadata } from "next";
import "./enterprise.css";
import "./product.css";
import { ThemeProvider } from "./theme-provider";
export const metadata: Metadata = {
  title: "BrahmaGPT · Singularity",
  description: "Singularity workspace for company search, tasks and approvals.",
  icons: { icon: "/brand/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const p=localStorage.getItem('brahma-theme');document.documentElement.dataset.theme=(p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))?'dark':'light'}catch{document.documentElement.dataset.theme='light'}",
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
