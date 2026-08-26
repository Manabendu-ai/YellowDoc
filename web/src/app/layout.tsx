import type { Metadata, Viewport } from "next";
import { Archivo, Darker_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider, themeBootScript } from "@/components/theme/ThemeProvider";
import "./globals.css";

/* Display: tall, narrow, dramatic at size — a financial broadsheet masthead. */
const display = Darker_Grotesque({
  subsets: ["latin"],
  variable: "--yd-font-display",
  display: "swap",
});

/* UI and body: utilitarian, with the plainness of a printed form. */
const sans = Archivo({
  subsets: ["latin"],
  variable: "--yd-font-sans",
  display: "swap",
});

/* Every value that came out of a document. Plex because the layout engine
   underneath is Docling, which is IBM's. */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--yd-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YellowDoc.ai — scanned invoices in, real spreadsheets out",
    template: "%s · YellowDoc.ai",
  },
  description:
    "YellowDoc.ai reads invoices, receipts, tax documents, and bank statements, then rebuilds them as multi-sheet Excel workbooks with every value preserved character for character. Ask questions about anything you have processed.",
  applicationName: "YellowDoc.ai",
  keywords: [
    "intelligent document processing",
    "PDF to Excel",
    "invoice extraction",
    "OCR",
    "financial documents",
    "retrieval augmented generation",
  ],
  openGraph: {
    title: "YellowDoc.ai — scanned invoices in, real spreadsheets out",
    description:
      "Turn financial documents into structured Excel workbooks without a single value being corrected, rounded, or invented.",
    siteName: "YellowDoc.ai",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d07" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        {/* Decides the theme before first paint so a dark reload never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
