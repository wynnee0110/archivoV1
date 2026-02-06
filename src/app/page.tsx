"use client";

import { useState, useEffect } from "react";

type Post = {
  id: number;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  dateCreated: string;
  
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const res = await fetch("/mock-post.json");
        const data = await res.json();
        setPosts(data.posts);
      } catch (err) {
        setError("Failed to load posts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <main className="flex justify-center bg-black min-h-screen text-white pt-16">
      
      {/* Feed column */}
      <div className="
        w-full max-w-xl
        min-h-screen
        border-l border-r  border-white/10
      ">
        {loading && (
          <p className="px-4 py-6 text-gray-400">Loading...</p>
        )}

        {error && (
          <p className="px-4 py-6 text-red-500">{error}</p>
        )}

        {!loading &&
          !error &&
          posts.map((post) => (
            <div
              key={post.id}
              className="
                px-4 py-5
                border-b border-white/10
                hover:bg-white/5
                transition-colors
                cursor-pointer
                m-10
              "
            >

                {/* Profile row */}
  <div className="flex items-start gap-3">
    
    {/* Avatar */}
    <img
      src={post.authorAvatar}
      alt={post.authorName}
      className="w-10 h-10 rounded-full object-cover"
    />

    {/* Post content */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">
          {post.authorName}
        </span>
        <span className="text-xs text-gray-400">
          • just now
        </span>
      </div>

      <h2 className="text-base font-semibold mt-1">
        {post.title}
      </h2>

      <p className="text-sm text-gray-300 mt-1">
        {post.content}
      </p>
    </div>
  </div>
</div>
          ))}
      </div>
    </main>
  );
}
