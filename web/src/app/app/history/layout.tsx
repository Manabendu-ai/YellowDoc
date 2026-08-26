import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description: "Every workbook this browser has converted, with a link to download it again.",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
