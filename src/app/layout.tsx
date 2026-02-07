import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/header";
import Footer from "./components/footer"; // Note: You imported this but didn't use it in your code below
import Floatbar from "./components/floatbar";
import { ThemeProvider } from "./components/ThemeProvider"; // <--- 1. Import this


// 1. Add Viewport export (for theme color)
export const viewport: Viewport = {
  themeColor: "#0f1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming like a native app
};

// 2. Update Metadata export


// ... keep your RootLayout function the same

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Update Metadata export
export const metadata: Metadata = {
  title: "AR Blog",
  description: "Next.js Social Media App",
  manifest: "/manifest.json", // <--- LINK THE MANIFEST HERE
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AR Blog",
  },
  formatDetection: {
    telephone: false,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. Add suppressHydrationWarning to prevent mismatch errors
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 3. Wrap everything in the Provider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <Floatbar />
          {children}
          {/* <Footer />  <-- You had this imported, uncomment if needed */}
        </ThemeProvider>

      </body>
    </html>
  );
}