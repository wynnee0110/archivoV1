import React, { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserSuggestion {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  isFollowing?: boolean;
}

const FollowStrip = ({ currentUserId }: { currentUserId: string }) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      
      // First, get the IDs of users the current user is already following
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      const followingIds = followData?.map(f => f.following_id) || [];

      // Get all profiles except current user AND users already being followed
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .neq("id", currentUserId);

      // Only add the "not in" filter if there are users being followed
      if (followingIds.length > 0) {
        query = query.not("id", "in", `(${followingIds.join(",")})`);
      }

      const { data: profiles, error } = await query.limit(10);

      if (error || !profiles) {
        setLoading(false);
        return;
      }

      // All returned profiles have isFollowing: false since we filtered them out
      const profilesWithFollowStatus = profiles.map(profile => ({
        ...profile,
        isFollowing: false
      }));

      setSuggestions(profilesWithFollowStatus);
      setLoading(false);
    };

    if (currentUserId) fetchSuggestions();
  }, [currentUserId]);

  const handleFollowToggle = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking follow button

    // Find the user in suggestions
    const userIndex = suggestions.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = suggestions[userIndex];

    try {
      // Insert follow relationship
      const { error } = await supabase
        .from("follows")
        .insert({ 
          follower_id: currentUserId, 
          following_id: userId 
        });

      if (error) throw error;

      // Remove the user from suggestions after following
      setSuggestions(suggestions.filter(u => u.id !== userId));
      
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleProfileClick = (userId: string) => {
    if (userId) {
      router.push(`/user/${userId}`);
    }
  };

  if (loading) return (
    <div className="w-full py-10 flex justify-center">
      <Loader2 className="animate-spin text-cyan-500/50" size={20} />
    </div>
  );

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full py-4 my-2 overflow-hidden border-y border-white/5 bg-white/[0.01]">
      <div className="flex justify-between items-center px-4 mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          People you might know
        </h3>
        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Swipe →</span>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-4 custom-scrollbar snap-x snap-mandatory">
        {suggestions.map((user) => (
          <div 
            key={user.id} 
            onClick={() => handleProfileClick(user.id)}
            className="flex-shrink-0 w-36 snap-center bg-[#1e212b]/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all hover:border-cyan-500/40 group cursor-pointer"
          >
            {/* Avatar Logic: Image or Initial */}
            {user.avatar_url ? (
               <img 
                 src={user.avatar_url} 
                 alt={user.full_name || user.username || "User"} 
                 className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform" 
               />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-inner group-hover:scale-105 transition-transform">
                {user.full_name?.[0] || user.username?.[0] || "?"}
              </div>
            )}
            
            <div className="text-center leading-tight">
              <p className="text-xs font-bold text-white truncate w-28">
                {user.full_name || "Mystery Human"}
              </p>
              <p className="text-[10px] text-slate-500">@{user.username || "anon"}</p>
            </div>

            <button 
              onClick={(e) => handleFollowToggle(user.id, e)}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-white text-black text-[10px] font-black rounded-lg hover:bg-cyan-400 transition-colors active:scale-95"
              aria-label={`Follow ${user.username || user.full_name}`}
            >
              <UserPlus size={12} />
              Follow
            </button>
          </div>
        ))}
      </div>

      {/* Scrollbar Styles - Visible on PC, Hidden on Mobile */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }

        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(6, 182, 212, 0.3) rgba(255, 255, 255, 0.05);
        }

        /* Hide scrollbar on mobile devices */
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FollowStrip;