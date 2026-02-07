"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { MessageCircle } from "lucide-react";

type CommentButtonProps = {
  postId: string;
  onClick: () => void;
};

export default function CommentButton({ postId, onClick }: CommentButtonProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const { count: commentCount, error } = await supabase
        .from("comments") // Ensure this matches your table name
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      if (!error) {
        setCount(commentCount || 0);
      }
    };

    fetchCount();
  }, [postId]);

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors group"
    >
      <MessageCircle 
        size={22} 
        className="group-hover:scale-110 transition-transform" 
      />
      <span className="text-xs font-black uppercase text-gray-400 group-hover:text-cyan-400 transition-colors">
        {count !== null ? `${count} Comments` : "Loading..."}
      </span>
    </button>
  );
}