"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient"; 
import { useRouter } from "next/navigation";
import { X, Loader2, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Authentication Check
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/auth");
      }
    };
    checkUser();
  }, [router]);

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Remove Image
  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Post Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!title.trim() && !content.trim()) && !image) return;

    setLoading(true);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to post.");
        router.push("/auth");
        return;
      }

      let finalImageUrl = null;

      // 2. Upload Image (if selected)
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      // 3. Insert into Supabase
      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        image_url: finalImageUrl, // Save the URL
      });

      if (error) throw error;

      // 4. Success! Redirect
      router.push("/");
      router.refresh(); 

    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = (title.length > 0 || content.length > 0 || image !== null);

  return (
    <main className="min-h-screen bg-[#0f1117]/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1e212b] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" /> 
            New Post
          </h2>
          <Link href="/">
            <button type="button" className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
              <X size={20} />
            </button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 space-y-2">
            <input
              autoFocus
              type="text"
              placeholder="Title your thought..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-600 outline-none py-3 border-b border-gray-800 focus:border-cyan-500/50 transition-colors"
            />
            <textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-24 bg-transparent text-gray-300 placeholder-gray-600 outline-none resize-none leading-relaxed text-[15px] py-3 scrollbar-hide"
            />

            {/* --- IMAGE PREVIEW --- */}
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-gray-700 group">
                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-64 object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="bg-black/20 px-5 py-4 flex items-center justify-between border-t border-white/5 mt-2">
            
            {/* --- IMAGE BUTTON --- */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="text-cyan-500/70 hover:text-cyan-400 transition-colors p-2 -ml-2 rounded-full hover:bg-cyan-500/10 flex items-center gap-2"
            >
              <ImageIcon size={20} />
              <span className="text-xs font-medium">Add Photo</span>
            </button>
            
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
            />

            <div className="flex items-center gap-4">
              <span className={`text-xs ${content.length > 200 ? "text-yellow-500" : "text-gray-600"}`}>
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={!isValid || loading}
                className={`
                  px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200
                  ${isValid 
                    ? "bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transform hover:scale-105" 
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"}
                `}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}