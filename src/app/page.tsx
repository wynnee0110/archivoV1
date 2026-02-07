"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from 'lucide-react';
import CommentModal from "./components/CommentModal";
import PostCard, { Post } from "./components/PostCard"; // <--- Import the component & type

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to track which post's comments are open
  const [activePostId, setActivePostId] = useState<string | null>(null); 
  
  const router = useRouter();

  // 1. Initial Data Fetch
  useEffect(() => {
    const getData = async () => {
      // Get Current User
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth"); 
        return;
      }
      setCurrentUser(session.user);

      // A. Get Posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        setLoading(false);
        return;
      }

      // B. Get Profiles for these posts
      const authorIds = [...new Set((postsData || []).map(post => post.author_id))];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds);

      // Create lookup map
      const profilesMap: Record<string, any> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Merge Data
      const combinedPosts = postsData?.map(post => ({
        ...post,
        author: profilesMap[post.author_id]
      }));

      setPosts(combinedPosts || []);
      setLoading(false);
    };

    getData();
  }, [router]);

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Delete Post Function
  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      alert("Error deleting post!");
      console.error(error);
    } else {
      setPosts(posts.filter((p) => p.id !== postId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-gray-200 p-4 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-lg mt-10 mb-24">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate max-w-[200px] sm:max-w-xs">
              {posts.find(p => p.author_id === currentUser.id)?.author?.full_name || currentUser?.email?.split('@')[0]}
            </h1>
          </div>

          {/* Create Post Link */}
          <Link href="/create">
             <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition shadow">
                + New Post
             </button>
          </Link>
        </div>

        {/* --- POSTS FEED --- */}
        <div className="flex flex-col gap-6">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-[#1e212b] rounded-2xl border border-gray-800 border-dashed">
              <p className="text-gray-500">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                onDelete={handleDelete}
                onCommentClick={setActivePostId} // Opens the modal
              />
            ))
          )}
        </div>
      </div>

      {/* --- RENDER COMMENT MODAL --- */}
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