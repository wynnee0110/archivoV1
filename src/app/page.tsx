"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import CommentModal from "@/app/components/CommentModal";
import PostCard from "@/app/components/PostCard"; 
import { fetchTechNews } from "@/app/lib/newsApi"; 

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  // 1. Added state to store your specific profile info
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); 
  const [activePostId, setActivePostId] = useState<string | null>(null); 
  const router = useRouter();

  const updateFeed = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsUpdating(true);

    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      let formattedDbPosts: any[] = [];
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(post => post.author_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, border_variant, badge")
          .in("id", authorIds);

        const profilesMap: Record<string, any> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });

        formattedDbPosts = postsData.map(post => ({
          ...post,
          author: profilesMap[post.author_id],
          is_news: false 
        }));
      }

      const newsPosts = await fetchTechNews();
      const allPosts = [...formattedDbPosts, ...newsPosts];

      if (allPosts.length > 0) {
        const newestItem = allPosts.reduce((prev, curr) => 
          new Date(curr.created_at) > new Date(prev.created_at) ? curr : prev
        );
        const remainingPosts = allPosts.filter(p => p.id !== newestItem.id);
        for (let i = remainingPosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingPosts[i], remainingPosts[j]] = [remainingPosts[j], remainingPosts[i]];
        }
        setPosts([newestItem, ...remainingPosts]);
      }
    } catch (error) {
      console.error("Feed update error:", error);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth"); 
        return;
      }
      setCurrentUser(session.user);

      // 2. FETCH DATA
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", session.user.id)
        .single();

      if (profile) setUserProfile(profile);

      await updateFeed(false);
    };

    init();

    const interval = setInterval(() => {
      updateFeed(true);
    }, 100000);

    return () => clearInterval(interval);
  }, [router, updateFeed]);

  const handleDelete = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (postToDelete?.is_news) return; 

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  // 3. LOGIC: Pick the best name to show
  const displayName = userProfile?.full_name || userProfile?.username || currentUser?.email?.split('@')[0];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117] p-4 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-lg mt-10 mb-24">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              Welcome back {isUpdating && <RefreshCw size={10} className="animate-spin text-cyan-500" />}
            </p>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 truncate max-w-[300px]">
              {displayName}
            </h1>
          </div>

          <Link href="/create">
             <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition shadow flex items-center gap-2 border border-gray-100">
                <Plus size={16} /> New Post
             </button>
          </Link>
        </div>

        {/* --- FEED --- */}
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onDelete={handleDelete}
              onCommentClick={setActivePostId}
            />
          ))}
        </div>
      </div>

      {activePostId && (
        <CommentModal 
          postId={activePostId} 
          currentUserId={currentUser?.id} 
          onClose={() => setActivePostId(null)} 
        />
      )}

    </main>
  );
}