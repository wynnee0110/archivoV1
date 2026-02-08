"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import CommentModal from "@/app/components/CommentModal";
import PostCard, { Post } from "@/app/components/PostCard"; 
import { fetchTechNews } from "@/app/lib/newsApi"; 

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); 
  
  const [activePostId, setActivePostId] = useState<string | null>(null); 
  const router = useRouter();

  const updateFeed = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsUpdating(true);

    try {
      // 1. Fetch Supabase Posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Fetch Profiles for Supabase posts
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

      // 3. Fetch Fresh GNews
      const newsPosts = await fetchTechNews();

      // 4. RANDOMIZED SHUFFLE LOGIC 🎲
      const allPosts = [...formattedDbPosts, ...newsPosts];

      if (allPosts.length > 0) {
        // Find the absolute newest item (User or News) to keep at index 0
        const newestItem = allPosts.reduce((prev, curr) => 
          new Date(curr.created_at) > new Date(prev.created_at) ? curr : prev
        );

        // Shuffle the rest using Fisher-Yates algorithm
        const remainingPosts = allPosts.filter(p => p.id !== newestItem.id);
        
        for (let i = remainingPosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingPosts[i], remainingPosts[j]] = [remainingPosts[j], remainingPosts[i]];
        }

        // Set the final randomized feed with the newest at the top
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
      await updateFeed(false);
    };

    init();

    // 🔄 AUTO-POLL: Update every 60 seconds
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117] p-4 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-lg mt-10 mb-24">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              Live Feed {isUpdating && <RefreshCw size={10} className="animate-spin" />}
            </p>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 truncate max-w-[200px]">
              {currentUser?.email?.split('@')[0]}
            </h1>
          </div>

          <Link href="/create">
             <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition shadow flex items-center gap-2">
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