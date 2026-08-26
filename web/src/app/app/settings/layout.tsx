import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Check the backend connection, choose an appearance, and see which endpoints this client talks to.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
