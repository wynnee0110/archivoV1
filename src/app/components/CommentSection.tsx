"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Send, Trash2, Loader2, MessageCircle, CornerDownRight, X } from "lucide-react";
import Link from "next/link";

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

// 1. Define the Type
interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author: {
    username: string;
    avatar_url: string;
    full_name?: string;
  } | null;
  replies?: Comment[];
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Fetch & Organize Comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          parent_id,
          author:profiles(username, avatar_url, full_name)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
      } else if (data) {
        // --- DATA TRANSFORMATION (Fixes the TS Error) ---
        const formattedData = data.map((item: any) => ({
          ...item,
          // If author comes back as an array, take the first item. Otherwise take it as is.
          author: Array.isArray(item.author) ? item.author[0] : item.author,
          replies: []
        }));

        // --- TREE BUILDER ---
        const commentMap: Record<string, Comment> = {};
        const rootComments: Comment[] = [];

        // A. Initialize map
        formattedData.forEach((c) => {
          commentMap[c.id] = c as Comment;
        });

        // B. Sort into Parents vs Children
        formattedData.forEach((c) => {
          if (c.parent_id && commentMap[c.parent_id]) {
            commentMap[c.parent_id].replies?.push(commentMap[c.id]);
          } else {
            rootComments.push(commentMap[c.id]);
          }
        });

        setComments(rootComments);
      }
      setLoading(false);
    };

    if (postId) fetchComments();
  }, [postId]);

  // 3. Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);

    try {
      // Step A: Insert
      const { data: insertedComment, error: insertError } = await supabase
        .from("comments")
        .insert({
          content: newComment,
          post_id: postId,
          user_id: currentUserId,
          parent_id: replyingTo?.id || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Step B: Fetch Author
      const { data: authorData } = await supabase
        .from("profiles")
        .select("username, avatar_url, full_name")
        .eq("id", currentUserId)
        .single();

      // Step C: Construct Object
      const fullComment: Comment = {
        ...insertedComment,
        author: authorData || { username: "Unknown", avatar_url: "" },
        replies: []
      };

      // Step D: Update UI
      if (fullComment.parent_id) {
        setComments((prev) => 
          prev.map((c) => {
            if (c.id === fullComment.parent_id) {
              return { ...c, replies: [...(c.replies || []), fullComment] };
            }
            return c;
          })
        );
      } else {
        setComments((prev) => [...prev, fullComment]);
      }

      setNewComment("");
      setReplyingTo(null);
    } catch (error: any) {
      console.error("Error adding comment:", error.message);
      alert("Failed to post.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;

      setComments((prev) => 
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
             ...c,
             replies: c.replies ? c.replies.filter((r) => r.id !== commentId) : []
          }))
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const initiateReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.author?.username || "User" });
    inputRef.current?.focus();
  };

  // 5. Render Single Comment
  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReply ? "mt-3" : "mt-6"}`}>
      <Link href={`/user/${comment.user_id}`} className="flex-shrink-0">
        <img 
          src={comment.author?.avatar_url || "/default-avatar.png"} 
          className={`${isReply ? "w-6 h-6" : "w-9 h-9"} rounded-full object-cover bg-gray-800 border border-gray-800`} 
          alt="avatar"
        />
      </Link>

      <div className="flex-1">
        <div className="bg-[#1e212b] border border-gray-800 p-3 rounded-2xl rounded-tl-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-white hover:underline cursor-pointer">
              @{comment.author?.username || "unknown"}
            </span>
            <span className="text-[10px] text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-1.5 ml-2">
          {!isReply && (
            <button 
              onClick={() => initiateReply(comment)}
              className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors font-medium"
            >
              <MessageCircle size={14} /> Reply
            </button>
          )}

          {currentUserId === comment.user_id && (
            <button 
              onClick={() => handleDeleteComment(comment.id)}
              className="text-xs text-gray-600 hover:text-red-500 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="w-full pb-32">
      <h3 className="text-white font-bold text-xl mb-8 flex items-center gap-2">
        Comments <span className="text-gray-500 text-sm font-normal">({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})</span>
      </h3>

      <div className="space-y-2 mb-10">
        {comments.length === 0 ? (
          <div className="p-8 text-center bg-[#1e212b]/50 rounded-2xl border border-dashed border-gray-800">
            <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-5 pl-4 border-l-2 border-gray-800/50 mt-2">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {currentUserId ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-40">
          <div className="max-w-2xl mx-auto">
            {replyingTo && (
              <div className="flex items-center justify-between bg-[#1e212b] px-4 py-2 rounded-t-xl border-x border-t border-cyan-500/30 mx-4">
                <span className="text-xs text-cyan-400 flex items-center gap-2 font-medium">
                  <CornerDownRight size={14} /> 
                  Replying to <span className="underline">@{replyingTo.username}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleAddComment} className="relative flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
                className={`w-full bg-[#1e212b] border border-gray-700 text-white py-4 px-6 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600 shadow-xl ${replyingTo ? 'rounded-b-full rounded-t-none' : 'rounded-full'}`}
                disabled={submitting}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="absolute right-2 p-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 left-0 right-0 text-center">
          <Link href="/auth">
            <span className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
              Log in to Comment
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}