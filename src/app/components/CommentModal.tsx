"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import Link from "next/link";
import { X, Send, Trash2, Loader2, User } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type CommentModalProps = {
  postId: string;
  currentUserId?: string;
  onClose: () => void;
};

export default function CommentModal({ postId, currentUserId, onClose }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles(username, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();
  }, [postId]);

  // 2. Add New Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
      alert("You must be logged in to comment.");
      return;
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);

    // Insert Comment
    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: newComment,
        post_id: postId,
        author_id: currentUserId,
      })
      .select(`*, author:profiles(username, full_name, avatar_url)`)
      .single();

    if (error) {
      console.error("Insert Error:", error);
      alert(`Failed to add comment: ${error.message}`);
    } else if (data) {
      setComments([...comments, data]); // Update UI instantly
      setNewComment(""); // Clear input
    }
    setSubmitting(false);
  };

  // 3. Delete Comment
  const handleDelete = async (commentId: string) => {
    const confirm = window.confirm("Delete this comment?");
    if (!confirm) return;

    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    
    if (error) {
      alert("Error deleting comment");
    } else {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#1e212b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#1e212b]">
          <h3 className="text-white font-bold">Comments ({comments.length})</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-400" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No comments yet.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Link href={`/user/${comment.author_id}`} className="flex-shrink-0">
                  {comment.author?.avatar_url ? (
                    <img src={comment.author.avatar_url} className="w-8 h-8 rounded-full object-cover border border-gray-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                      {comment.author?.username?.[0] || <User size={14} />}
                    </div>
                  )}
                </Link>

                <div className="flex-1">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white text-sm font-semibold hover:underline cursor-pointer">
                        {comment.author?.full_name || "User"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                  </div>
                  
                  {currentUserId === comment.author_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)} 
                      className="text-[10px] text-red-500/50 hover:text-red-400 mt-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleAddComment} className="p-4 border-t border-gray-700 bg-[#1e212b]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              className="flex-1 bg-black/20 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none transition-colors"
            />
            <button 
              type="submit" 
              disabled={!newComment.trim() || submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}