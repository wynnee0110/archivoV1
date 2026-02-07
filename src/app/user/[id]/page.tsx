"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient"; 
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Link as LinkIcon, Edit3, Loader2, UserPlus, UserCheck, X, User } from 'lucide-react';
import CommentModal from "@/app/components/CommentModal";
import PostCard, { Post } from "@/app/components/PostCard"; // <--- Import PostCard

// Define Types
type ProfileData = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  website: string | null;
};

export default function UserProfile() {
  const params = useParams();
  const targetUserId = params.id as string; 
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // Use Post type
  
  // Stats
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Comment Modal State
  const [activePostId, setActivePostId] = useState<string | null>(null);
  
  // Follower/Following Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<ProfileData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch Target Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({
          id: targetUserId,
          full_name: "Unknown User",
          username: "user",
          bio: "Profile not set up.",
          avatar_url: null,
          website: null
        });
      }

      // Fetch Posts
      const { data: postData } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", targetUserId)
        .order("created_at", { ascending: false });

      if (postData) setPosts(postData);

      // Fetch Stats
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", targetUserId);
      setFollowersCount(followers || 0);

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", targetUserId);
      setFollowingCount(following || 0);

      if (user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    }

    getData();
  }, [targetUserId]);

  // --- OPEN FOLLOWER/FOLLOWING MODAL ---
  const openModal = async (type: 'followers' | 'following') => {
    setModalType(type);
    setShowModal(true);
    setModalLoading(true);
    setModalUsers([]);

    try {
      let userIds: string[] = [];

      if (type === 'followers') {
        const { data } = await supabase.from('follows').select('follower_id').eq('following_id', targetUserId);
        userIds = data?.map(d => d.follower_id) || [];
      } else {
        const { data } = await supabase.from('follows').select('following_id').eq('follower_id', targetUserId);
        userIds = data?.map(d => d.following_id) || [];
      }

      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        setModalUsers(profiles || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  // --- HANDLE FOLLOW TOGGLE ---
  const handleFollowToggle = async () => {
    if (!currentUser) return router.push("/auth");
    const originalState = isFollowing;
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

    try {
      if (originalState) {
        await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", targetUserId);
      } else {
        await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: targetUserId });
      }
    } catch (error) {
      setIsFollowing(originalState);
    }
  };

  // --- DELETE POST (If viewing own public profile) ---
  const handleDelete = async (postId: string) => {
    if (!currentUser || currentUser.id !== targetUserId) return;
    
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    );
  }

  const isOwnProfile = currentUser?.id === targetUserId;

  return (
    <main className="flex flex-col items-center min-h-screen bg-[#0f1117] text-gray-200 p-4 font-sans">
      
      <div className="w-full max-w-lg flex flex-col gap-6 mt-10 mb-24">
        
        {/* --- PROFILE CARD --- */}
        <div className="bg-[#1e212b] rounded-2xl shadow-xl overflow-hidden border border-gray-800 relative">
          
          <div className="h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative"></div>

          <div className="px-6 pb-6">
            <div className="flex justify-between items-start">
              
              {/* Avatar */}
              <div className="relative -mt-12">
                <div className="p-1 bg-[#1e212b] rounded-full inline-block relative">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[#1e212b] shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#1e212b] shadow-lg">
                      {profile?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4">
                {isOwnProfile ? (
                  <button onClick={() => router.push('/profile')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-semibold rounded-full border border-gray-700 transition-colors flex items-center gap-2">
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowToggle}
                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
                      isFollowing 
                        ? "bg-transparent border border-gray-600 text-white hover:border-red-500/50 hover:text-red-400" 
                        : "bg-white text-black hover:bg-gray-200"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="mt-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">{profile?.full_name || "User"}</h2>
              <p className="text-gray-500 text-sm">@{profile?.username || "unknown"}</p>
              <p className="mt-4 text-gray-300 leading-relaxed text-[15px]">{profile?.bio || "No bio available."}</p>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-500 text-xs">
              <div className="flex items-center gap-1"><MapPin size={14} /> Earth</div>
              {profile?.website && (
                <div className="flex items-center gap-1 hover:text-indigo-400 transition cursor-pointer">
                  <LinkIcon size={14} /> <a href={profile.website} target="_blank" className="hover:underline">Website</a>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-800 my-6" />

            {/* --- CLICKABLE STATS --- */}
            <div className="grid grid-cols-3 text-center divide-x divide-gray-800">
              <button onClick={() => openModal('following')} className="flex flex-col hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-white font-bold text-lg">{followingCount}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Following</span>
              </button>
              <button onClick={() => openModal('followers')} className="flex flex-col hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-white font-bold text-lg">{followersCount}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Followers</span>
              </button>
              <div className="flex flex-col py-1">
                <span className="text-white font-bold text-lg">{posts.length}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- POSTS (Using PostCard Component) --- */}
        <h3 className="text-lg font-bold text-white px-2">
            {isOwnProfile ? "Your Posts" : `${profile?.username || "User"}'s Posts`}
        </h3>
        
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id}
              // Construct the author object since we already have the profile data
              post={{
                ...post,
                author: {
                  username: profile?.username || "User",
                  full_name: profile?.full_name || "User",
                  avatar_url: profile?.avatar_url || null
                }
              }}
              currentUserId={currentUser?.id}
              // Only pass onDelete if it's your own profile
              onDelete={isOwnProfile ? handleDelete : undefined}
              onCommentClick={setActivePostId}
            />
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No posts yet.
            </div>
          )}
        </div>
      </div>

      {/* --- FOLLOWER/FOLLOWING MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e212b] border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-bold capitalize">{modalType}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white bg-gray-800 p-1 rounded-full"><X size={18} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {modalLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-400" /></div>
              ) : modalUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {modalUsers.map((u) => (
                    <Link href={`/user/${u.id}`} key={u.id} onClick={() => setShowModal(false)}>
                      <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition cursor-pointer">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="Av" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                            {u.username?.[0] || <User size={16} />}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">{u.full_name}</p>
                          <p className="text-gray-500 text-xs">@{u.username}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER COMMENT MODAL --- */}
      {activePostId && (
        <CommentModal 
          postId={activePostId} 
          currentUserId={currentUser?.id} 
          onClose={() => setActivePostId(null)} 
        />
      )}

    </main>
  );
}