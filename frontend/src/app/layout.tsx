import "@cloudscape-design/global-styles/index.css";
import React from "react";
import { AppProviders } from "@/lib/providers";

export const metadata = {
  title: "Amazon Route 53 Clone",
  description: "AWS Route 53 Web Application Clone built with Next.js, Cloudscape, and FastAPI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
