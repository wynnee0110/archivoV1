"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { MessageCircle } from "lucide-react";

type CommentButtonProps = {
  postId: string;
  onClick: () => void; // Parent handles opening the modal
};

export default function CommentButton({ postId, onClick }: CommentButtonProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count: commentCount, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true }) // 'head: true' means we only ask for the number, not data
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
      className="flex items-center gap-2 text-sm hover:text-blue-400 transition group"
    >
      <MessageCircle size={18} className="group-hover:scale-110 transition-transform" /> 
      <span>{count}</span>
    </button>
  );
}