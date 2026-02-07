"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { X, Share2, Loader2 } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import CommentButton from "@/app/components/CommentButton"; // <--- Import logic
import CommentModal from "@/app/components/CommentModal";

export default function PostDetailPage() {
  const { id } = useParams(); 
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  useEffect(() => {
    const getData = async () => {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth"); 
        return;
      }
      setCurrentUser(session.user);

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (postError || !postData) {
        setLoading(false);
        return;
      }

      const { data: authorData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", postData.author_id)
        .single();

      setPost({ ...postData, author: authorData });
      setLoading(false);
    };

    getData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  if (!post) return <div className="text-white text-center p-20">Post not found.</div>;

  return (
    <main className="min-h-screen bg-black/90 flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="relative z-10 bg-white dark:bg-[#161821] w-full max-w-2xl h-screen sm:h-auto sm:max-h-[92vh] flex flex-col sm:rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-800 sticky top-0 bg-[#161821] z-20">
          <div className="flex items-center gap-3">
            <img 
              src={post.author?.avatar_url || "/default-avatar.png"} 
              className="w-9 h-9 rounded-full object-cover" 
            />
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold dark:text-white">@{post.author?.username || "unknown"}</span>
              <span className="text-[10px] text-gray-500 uppercase">{post.author?.full_name}</span>
            </div>
          </div>
          <Link href="/" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white">
            <X size={20}/>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-black text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-gray-300 text-lg mb-8 whitespace-pre-wrap">
              {post.content}
            </p>
            
            {post.image_url && (
              <img 
                src={post.image_url} 
                className="rounded-3xl w-full h-auto mb-8 shadow-xl" 
              />
            )}

            <div className="flex items-center justify-between py-6 border-y dark:border-gray-800 mb-8">
              <div className="flex items-center gap-8">
                
                <LikeButton 
                  postId={post.id} 
                  currentUserId={currentUser?.id} 
                />
                
                {/* --- UPDATED COMMENT BUTTON --- */}
                <CommentButton 
                  postId={post.id} 
                  onClick={() => setIsCommentModalOpen(true)} 
                />

              </div>
              <Share2 size={20} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Modal */}
        {isCommentModalOpen && (
          <CommentModal 
            postId={post.id} 
            currentUserId={currentUser?.id} 
            onClose={() => setIsCommentModalOpen(false)} 
          />
        )}
        
      </div>
    </main>
  );
}