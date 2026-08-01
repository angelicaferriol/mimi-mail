import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mimi Mail",
  description: "Share your page, receive anonymous cute notes from your friends and visitors, and reply directly in a retro-90s desktop style!",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mimi-theme');
                  var theme = saved || 'theme-peach';
                  document.body.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
