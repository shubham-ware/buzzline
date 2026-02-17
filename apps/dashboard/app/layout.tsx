import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buzzline Dashboard",
  description: "Manage your video calling projects",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
