import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nature Assurance — River Barle",
  description: "A constitutionally governed route from contested ecological evidence to a human-authorised conclusion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
