"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Moon, Sun, LogOut, ChevronLeft, User, 
  Bell, Shield, Trash2, Mail, Lock, ChevronRight, X, Loader2 
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");

  // --- PASSWORD MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 1. Fetch User & Check Theme
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();

    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, [router]);

  // 2. Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // 3. Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // 4. Update Password Function
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      alert("Password updated successfully!");
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-200 transition-colors duration-300 pb-20">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6 mt-4">

        {/* --- APPEARANCE --- */}
        <div className="bg-white dark:bg-[#1e212b] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider p-4 pb-2">Appearance</h2>
          <div onClick={toggleTheme} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'}`}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Theme</span>
                <span className="text-xs text-gray-500">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        {/* --- ACCOUNT --- */}
        <div className="bg-white dark:bg-[#1e212b] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider p-4 pb-2">Account</h2>
          
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-full">
                <Mail size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Email</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
          </div>

          <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer border-b border-gray-100 dark:border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-full">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Edit Profile</span>
                <span className="text-xs text-gray-500">Change name, bio, avatar</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>

          {/* 👇 CHANGE PASSWORD BUTTON */}
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full">
                <Lock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Change Password</span>
                <span className="text-xs text-gray-500">Update your login credentials</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* --- ACTIONS --- */}
        <div className="bg-white dark:bg-[#1e212b] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider p-4 pb-2">Actions</h2>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition text-gray-700 dark:text-gray-200"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <LogOut size={20} />
            </div>
            <span className="font-semibold text-sm">Log Out</span>
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800/50" />

          <button 
            onClick={() => alert("Contact support to delete account.")}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 text-left transition text-red-500"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Trash2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Delete Account</span>
              <span className="text-xs opacity-70">Permanently remove your data</span>
            </div>
          </button>
        </div>

        <div className="text-center mt-6 mb-12">
            <p className="text-xs text-gray-400">App Version 1.1.0</p>
            <p className="text-[10px] text-gray-500 mt-1">© archive</p>
        </div>

      </div>

      {/* --- PASSWORD MODAL --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1e212b] border border-gray-200 dark:border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            
            <button 
              onClick={() => setIsPasswordModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={24} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-gray-500">Enter your new password below.</p>
              </div>

              <div className="flex flex-col gap-3">
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-cyan-500 transition-colors"
                />
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button 
                onClick={handleUpdatePassword}
                disabled={passwordLoading}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}