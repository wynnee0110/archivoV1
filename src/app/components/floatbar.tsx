"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, User, Send, PlusCircle } from "lucide-react"; // Import icons

export default function Floatbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname(); // To detect active page

  // Navigation Data
  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/create", icon: PlusCircle, label: "Post", isPrimary: true }, // Highlighted button
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling DOWN and past 50px, hide bar. 
      // If scrolling UP, show bar.
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`fixed bottom-6 left-0 w-full flex justify-center z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-[200%]"
      }`}
    >
      {/* Glass Container */}
      <nav className="flex items-center gap-1 px-2 py-2 bg-[#1e212b]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50">
        
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={i} href={item.href}>
              <div
                className={`
                  relative flex items-center justify-center
                  w-12 h-12 rounded-full transition-all duration-300
                  ${
                    item.isPrimary
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 mx-2"
                      : isActive
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {/* Icon */}
                <Icon size={item.isPrimary ? 24 : 22} strokeWidth={item.isPrimary ? 2.5 : 2} />

                {/* Active Indicator Dot (only for non-primary buttons) */}
                {isActive && !item.isPrimary && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}