"use client";

import { Search, LogOut, User, Settings, Bell, Heart, MessageCircle, UserPlus, Moon, Sun } from "lucide-react"; // Added Moon, Sun
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useTheme } from "next-themes"; // <--- 1. Import hook

// --- Notification Type ---
type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow';
  read: boolean;
  created_at: string;
  post_id?: string;
  actor?: {
    username: string;
    avatar_url: string | null;
  };
};

export default function Header() {
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Theme Logic
  const { theme, setTheme } = useTheme(); // <--- 2. Get theme
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true); // Fix hydration mismatch

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (profile) setAvatarUrl(profile.avatar_url);
        fetchNotifications(user.id);
        
        const channel = supabase
          .channel('realtime-notifs')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
            () => fetchNotifications(user.id)
          )
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      }
    };
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select(`*, actor:profiles(username, avatar_url)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markRead = async (notifId: string) => {
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-xl transition-colors">
      <div className="flex h-16 w-full items-center justify-between px-4 max-w-lg mx-auto gap-4">
        
        {/* --- LOGO --- */}
        <Link href="/" className="flex-shrink-0">
          <h2 className="select-none font-black italic text-3xl text-transparent bg-clip-text bg-white from-cyan-400 to-blue-500 cursor-pointer">
            a
          </h2>
        </Link>

        {/* --- SEARCH BAR --- */}
        <form onSubmit={handleSearch} className="relative group flex-1 max-w-[200px] sm:max-w-[240px]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full py-2 pl-10 pr-4 bg-gray-100 dark:bg-[#1e212b]/50 border border-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm rounded-full outline-none focus:bg-white dark:focus:bg-[#1e212b] focus:border-cyan-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-3">
          
{/* --- NOTIFICATIONS --- */}
<div className="relative" ref={notifRef}>
  <button 
    onClick={() => setIsNotifOpen(!isNotifOpen)}
    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-all"
  >
    <Bell size={20} />
    {unreadCount > 0 && (
      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f1117]">
        {unreadCount}
      </span>
    )}
  </button>

  {isNotifOpen && (
    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1e212b] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h3 className="font-bold text-sm dark:text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => notifications.forEach(n => !n.read && markRead(n.id))}
            className="text-[10px] text-cyan-500 hover:underline font-bold uppercase tracking-tighter"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => {
                markRead(notif.id);
                if (notif.post_id) router.push(`/post/${notif.post_id}`);
                setIsNotifOpen(false);
              }}
              className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-800/50 cursor-pointer transition-colors ${!notif.read ? 'bg-cyan-500/5 dark:bg-cyan-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <div className="relative flex-shrink-0">
                <img 
                  src={notif.actor?.avatar_url || "/default-avatar.png"} 
                  className="w-10 h-10 rounded-full object-cover" 
                  alt=""
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-[#1e212b] rounded-full shadow-sm">
                  {notif.type === 'like' && <Heart size={10} className="fill-red-500 text-red-500" />}
                  {notif.type === 'comment' && <MessageCircle size={10} className="text-blue-500" />}
                  {notif.type === 'follow' && <UserPlus size={10} className="text-green-500" />}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm dark:text-gray-200 leading-snug">
                  <span className="font-bold">@{notif.actor?.username}</span>{' '}
                  {notif.type === 'like' && 'liked your post'}
                  {notif.type === 'comment' && 'commented on your post'}
                  {notif.type === 'follow' && 'started following you'}
                </p>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {!notif.read && <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2" />}
            </div>
          ))
        ) : (
          <div className="p-10 text-center flex flex-col items-center gap-2">
            <Bell size={32} className="text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  )}
</div>

          {/* --- USER MENU --- */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all overflow-hidden ${isMenuOpen ? 'ring-2 ring-cyan-500' : 'border-gray-200 dark:border-white/10'}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 w-full h-full flex items-center justify-center">
                  <User size={18} className="text-gray-400" />
                </div>
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1e212b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                <div className="p-1.5 flex flex-col gap-1">
                  
                  {/* Profile Link */}
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User size={16} /> Profile
                  </Link>
                  
                  {/* Settings Link */}
                  <Link 
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings size={16} /> Settings
                  </Link>

                  {/* --- THEME TOGGLE (Embedded) --- */}
                  {mounted && (
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                      </div>
                      
                      {/* Simple Switch UI */}
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} style={{ left: theme === 'dark' ? '18px' : '2px' }} />
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-2" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}