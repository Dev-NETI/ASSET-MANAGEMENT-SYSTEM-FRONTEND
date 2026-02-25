import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory System",
  description: "Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontSize: '14px',
              background: '#fafaf5',
              color: '#070505',
              border: '1px solid #e5e0d5',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#cdac6a', secondary: '#fafaf5' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fafaf5' } },
          }}
        />
      </body>
    </html>
  );
}
