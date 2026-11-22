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
              "try{document.documentElement.dataset.theme=localStorage.getItem('brahma-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}",
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
