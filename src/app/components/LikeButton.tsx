"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

// 1. Update the type to allow 'undefined'
type LikeButtonProps = {
  postId: string;
  currentUserId?: string; // <--- Added '?' here
};

export default function LikeButton({ postId, currentUserId }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchLikes = async () => {
      // Get User's Like Status (Only if user exists)
      if (currentUserId) {
        const { data } = await supabase
          .from("post_likes")
          .select("*")
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .single();
        setIsLiked(!!data);
      }

      // Get Total Like Count
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      
      setLikeCount(count || 0);
    };

    fetchLikes();
  }, [postId, currentUserId]);

  const toggleLike = async () => {
    // 2. Safety Check: If no user, redirect to login
    if (!currentUserId) {
      router.push("/auth");
      return;
    }

    // Optimistic Update (Instant UI change)
    const originalLiked = isLiked;
    const originalCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      if (originalLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: currentUserId });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(originalLiked);
      setLikeCount(originalCount);
      console.error(error);
    }
  };

  return (
    <button 
      onClick={toggleLike}
      className={`flex items-center gap-2 text-sm transition group ${isLiked ? "text-pink-500" : "text-gray-500 hover:text-pink-400"}`}
    >
      <Heart 
        size={18} 
        className={`transition-transform group-hover:scale-110 ${isLiked ? "fill-pink-500" : ""}`} 
      />
      <span>{likeCount}</span>
    </button>
  );
}