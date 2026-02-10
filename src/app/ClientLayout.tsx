"use client";

import { useState, useEffect } from "react";
import Header from "./components/header";
import Floatbar from "./components/floatbar";
import { ThemeProvider } from "./components/ThemeProvider";
import LoadingScreen from "./components/LoadingScreen";
import { usePathname } from "next/navigation";


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  const pathname = usePathname();
  
  const hideNavbar = ["/auth", "/register"];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {isLoading && <LoadingScreen />}
      <div className={isLoading ? "hidden" : "block animate-in fade-in duration-700"}>
        {!hideNavbar.includes(pathname) && <Header />}
        {!hideNavbar.includes(pathname) && <Floatbar />}
        <main>{children}</main>
      </div>
    </ThemeProvider>
  );
}