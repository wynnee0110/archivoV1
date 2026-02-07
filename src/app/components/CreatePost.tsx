"use client";

import { useState, useRef } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react";

export default function CreatePost({ onPostCreated }: { onPostCreated: (post: any) => void }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create a fake URL for preview
    }
  };

  // Remove Selected Image
  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Post
  const handlePost = async () => {
    if (!content.trim() && !image) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalImageUrl = null;

      // 1. Upload Image (if exists)
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

      // 2. Insert Post
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          image_url: finalImageUrl,
          author_id: user.id
        })
        .select('*, author:profiles(*)')
        .single();

      if (error) throw error;

      // 3. Reset & Notify Parent
      setContent("");
      removeImage();
      onPostCreated(data); // Tells HomePage to add this new post to the list instantly

    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e212b] p-4 rounded-2xl border border-gray-800 mb-6 shadow-lg">
      <div className="flex gap-4">
        {/* Input Area */}
        <div className="flex-1">
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg outline-none resize-none min-h-[50px]"
          />

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative mt-3 inline-block">
              <img src={previewUrl} alt="Preview" className="max-h-60 rounded-xl border border-gray-700" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
            {/* Image Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-cyan-400 hover:bg-cyan-400/10 p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ImageIcon size={20} />
              <span>Photo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Post Button */}
            <button
              onClick={handlePost}
              disabled={loading || (!content && !image)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Post <Send size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}