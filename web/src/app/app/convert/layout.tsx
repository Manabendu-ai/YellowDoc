import type { Metadata } from "next";

/**
 * The screen itself is a client component and so cannot export metadata; this
 * thin server layout exists only to title the tab. Same for the three siblings.
 */
export const metadata: Metadata = {
  title: "Convert",
  description:
    "Upload a PDF, scan, or office document and get back a multi-sheet Excel workbook with every value preserved exactly as written.",
};

export default function ConvertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
