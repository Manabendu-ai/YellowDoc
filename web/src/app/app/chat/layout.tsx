import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask questions about the documents you have already converted. Answers are retrieved from your own files and quote them directly.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
