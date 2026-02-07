"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSignup, setIsSignup] = useState(false); // Default to Login usually looks cleaner
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form refresh
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignup) {
        // --- SIGNUP LOGIC ---
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // Optional: Redirect to this URL after email verification
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        
        if (error) throw error;
        alert("Signup successful! Check your email to confirm.");
        setIsSignup(false); // Switch to login screen
      } else {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) throw error;
        router.push("/"); // Redirect to Home
        router.refresh();
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* --- AUTH CARD --- */}
      <div className="w-full max-w-md bg-[#1e212b]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <h1 className="
            inline-block text-5xl font-black italic mb-2
            text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500
            drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]
          ">
            aR
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignup ? "Create your account" : "Welcome back, traveler"}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all"
              required
              minLength={6}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isSignup ? "Sign Up" : "Log In"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isSignup ? "Already have an account?" : "Don't have an account yet?"}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setErrorMsg("");
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-all ml-1"
            >
              {isSignup ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}