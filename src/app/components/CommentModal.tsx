"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import Link from "next/link";
import { X, Send, Trash2, Loader2, User, MessageCircle, CornerDownRight } from "lucide-react";

/* ================= TYPES ================= */

type Comment = {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  parent_id: string | null;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
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

  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /* ================= FETCH COMMENTS ================= */

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles!comments_author_id_fkey(
            username,
            full_name,
            avatar_url
          )
        `) // ✅ specify which FK to use
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
      } else if (data) {
        const map: Record<string, Comment> = {};
        const roots: Comment[] = [];

        // create map
        data.forEach((c) => {
          map[c.id] = { ...c, replies: [] };
        });

        // build tree
        data.forEach((c) => {
          if (c.parent_id && map[c.parent_id]) {
            map[c.parent_id].replies?.push(map[c.id]);
          } else {
            roots.push(map[c.id]);
          }
        });

        setComments(roots);
      }

      setLoading(false);
    };

    fetchComments();
  }, [postId]);

  /* ================= ADD COMMENT ================= */

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) return alert("You must be logged in.");
    if (!newComment.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: newComment,
        post_id: postId,
        author_id: currentUserId,
        parent_id: replyingTo?.id || null,
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(
          username,
          full_name,
          avatar_url
        )
      `) // ✅ same fix here
      .single();

    if (error) {
      alert(`Failed to add comment: ${error.message}`);
    } else if (data) {
      const newItem: Comment = { ...data, replies: [] };

      if (newItem.parent_id) {
        // reply
        setComments((prev) =>
          prev.map((c) =>
            c.id === newItem.parent_id
              ? { ...c, replies: [...(c.replies || []), newItem] }
              : c
          )
        );
      } else {
        // root
        setComments((prev) => [...prev, newItem]);
      }

      setNewComment("");
      setReplyingTo(null);
    }

    setSubmitting(false);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    const { error } = await supabase.from("comments").delete().eq("id", commentId);

    if (!error) {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? c.replies.filter((r) => r.id !== commentId) : [],
          }))
      );
    }
  };

  /* ================= REPLY HELPER ================= */

  const initiateReply = (comment: Comment) => {
    setReplyingTo({
      id: comment.id,
      username: comment.author?.username || "User",
    });

    inputRef.current?.focus();
  };

  /* ================= COMMENT ITEM ================= */

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "mt-3" : "mt-4"}`}>
      {/* avatar */}
      <Link href={`/user/${comment.author_id}`} className="flex-shrink-0">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            className={`${isReply ? "w-6 h-6" : "w-8 h-8"} rounded-full object-cover border border-gray-700`}
          />
        ) : (
          <div
            className={`${isReply ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"} rounded-full bg-gray-700 flex items-center justify-center text-white font-bold`}
          >
            {comment.author?.username?.[0] || <User size={12} />}
          </div>
        )}
      </Link>

      <div className="flex-1">
        <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
          <div className="flex justify-between items-start mb-1">
            <span className="text-white text-sm font-semibold">
              {comment.author?.full_name || "User"}
            </span>
            <span className="text-[10px] text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm">{comment.content}</p>
        </div>

        <div className="flex items-center gap-3 mt-1 ml-2">
          {!isReply && (
            <button
              onClick={() => initiateReply(comment)}
              className="text-[11px] text-gray-500 hover:text-cyan-400 flex items-center gap-1"
            >
              <MessageCircle size={12} /> Reply
            </button>
          )}

          {currentUserId === comment.author_id && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-[11px] text-red-500/50 hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e212b] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-bold">Comments</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-cyan-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No comments yet.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem comment={comment} />

                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-9 pl-3 border-l-2 border-gray-800">
                    {comment.replies.map((reply) => (
                      <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* input */}
        <div className="p-4 border-t border-gray-700">
          {replyingTo && (
            <div className="flex items-center justify-between bg-cyan-500/10 px-3 py-1.5 rounded-t-lg border-x border-t border-cyan-500/20 mb-[-1px]">
              <span className="text-xs text-cyan-400 flex items-center gap-1">
                <CornerDownRight size={12} /> Replying to @{replyingTo.username}
              </span>
              <button onClick={() => setReplyingTo(null)} className="text-cyan-400/50">
                <X size={12} />
              </button>
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              className="flex-1 bg-black/20 border border-gray-700 text-sm text-white px-4 py-2 rounded-full"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black p-2 rounded-full disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
