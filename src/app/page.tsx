"use client";

import { useState, useEffect } from "react";

type Post = {
  id: number;
  title: string;
  content: string;
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
        border-l border-r border-t border-white/10
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
              "
            >
              <h2 className="text-base font-semibold">
                {post.title}
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                {post.content}
              </p>
            </div>
          ))}
      </div>
    </main>
  );
}
