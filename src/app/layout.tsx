import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mimi Mail ✉️",
  description: "Share your page, receive anonymous cute notes from your friends and visitors, and reply directly in a retro-90s desktop style!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
