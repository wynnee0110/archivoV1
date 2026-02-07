"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { Loader2, Heart, MessageCircle, Share2, User, ArrowRight } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q"); 
  
  const [posts, setPosts] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]); // New state for users
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      
      if (!query) {
        setPosts([]);
        setPeople([]);
        setLoading(false);
        return;
      }

      // Run both queries in parallel for speed
      const [postsResult, peopleResult] = await Promise.all([
        // 1. Search Posts (Title or Content)
        supabase
          .from("posts")
          .select(`*, author:profiles(username, full_name, avatar_url)`)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .order("created_at", { ascending: false }),

        // 2. Search People (Username or Full Name)
        supabase
          .from("profiles")
          .select("*")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(5) // Limit to top 5 matching users
      ]);

      if (postsResult.error) console.error("Post search error:", postsResult.error);
      else setPosts(postsResult.data || []);

      if (peopleResult.error) console.error("People search error:", peopleResult.error);
      else setPeople(peopleResult.data || []);

      setLoading(false);
    };

    fetchResults();
  }, [query]);

  return (
    <main className="min-h-screen bg-[#0f1117] text-gray-200 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg mt-10 mb-24">
        
        {/* Search Header */}
        <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Results for: <span className="text-cyan-400">"{query}"</span>
        </h1>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
          </div>
        )}

        {/* No Results */}
        {!loading && posts.length === 0 && people.length === 0 && (
          <div className="text-center py-10 bg-[#1e212b] rounded-2xl border border-gray-800 border-dashed">
            <p className="text-gray-500">No results found.</p>
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* --- PEOPLE RESULTS SECTION --- */}
          {!loading && people.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">People</h3>
              
              {people.map((person) => (
                <Link href={`/user/${person.id}`} key={person.id}>
                  <div className="bg-[#1e212b] p-4 rounded-xl border border-gray-800 hover:border-cyan-500/50 hover:bg-[#232732] transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="Av" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                          {person.username?.[0]?.toUpperCase() || <User size={20} />}
                        </div>
                      )}
                      
                      {/* Name Info */}
                      <div>
                        <h4 className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">
                          {person.full_name || "User"}
                        </h4>
                        <p className="text-gray-500 text-xs">@{person.username}</p>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <ArrowRight size={18} className="text-gray-600 group-hover:text-cyan-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* --- POST RESULTS SECTION --- */}
          {!loading && posts.length > 0 && (
            <div className="flex flex-col gap-4">
               {people.length > 0 && <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Posts</h3>}
              
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#1e212b] p-5 rounded-2xl shadow-sm border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Link href={`/user/${post.author_id}`}>
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt="Av" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {post.author?.username?.[0] || "?"}
                        </div>
                      )}
                    </Link>
                    <div>
                      <h4 className="text-white font-semibold text-sm">
                        {post.author?.full_name || "Unknown User"}
                      </h4>
                      <p className="text-gray-500 text-xs">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    {post.title && <h2 className="text-lg font-bold text-white mb-2">{post.title}</h2>}
                    <p className="text-gray-300 text-[15px] leading-relaxed">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-800 text-gray-500">
                    <Heart size={18} /> 
                    <MessageCircle size={18} /> 
                    <Share2 size={18} className="ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}