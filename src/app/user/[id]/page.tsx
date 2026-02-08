"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient"; 
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Link as LinkIcon, Edit3, Loader2, UserPlus, UserCheck, X, User } from 'lucide-react';
import CommentModal from "@/app/components/CommentModal";
import PostCard, { Post } from "@/app/components/PostCard"; 
import UserBadge from "@/app/components/UserBadge"; 

type ProfileData = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  website: string | null;
  border_variant?: string | null; 
  badge?: string | null; 
};

export default function UserProfile() {
  const params = useParams();
  const targetUserId = params.id as string; 
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); 
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<ProfileData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Scroll to top when component mounts or user changes
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

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
          website: null,
          border_variant: 'none',
          badge: null
        });
      }

      const { data: postData } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", targetUserId)
        .order("created_at", { ascending: false });

      if (postData) {
        const postsWithAuthor = postData.map(p => ({
          ...p,
          author: profileData 
        }));
        setPosts(postsWithAuthor);
      }

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

  const handleDelete = async (postId: string) => {
    if (!currentUser || currentUser.id !== targetUserId) return;
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    );
  }

  const isOwnProfile = currentUser?.id === targetUserId;
  const borderVariant = profile?.border_variant || 'none'; 

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-200 p-4 font-sans transition-colors duration-300">
      
      <div className="w-full max-w-lg flex flex-col gap-6 mt-10 mb-24">
        
        {/* --- PROFILE CARD --- */}
        <div className="bg-white dark:bg-[#1e212b] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative transition-colors duration-300">
          
          <div className="h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative"></div>

          <div className="px-6 pb-6">
            <div className="flex justify-between items-start">
              
              <div className="relative -mt-12">
                <div className={`avatar-wrapper border-${borderVariant} p-1 bg-white dark:bg-[#1e212b] rounded-full inline-block transition-colors duration-300`}>
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1e212b] shadow-lg bg-white dark:bg-[#1e212b]" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-[#1e212b] shadow-lg">
                      {profile?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {isOwnProfile ? (
                  <button onClick={() => router.push('/profile')} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold rounded-full border border-gray-300 dark:border-gray-700 transition-colors flex items-center gap-2">
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowToggle}
                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
                      isFollowing 
                        ? "bg-transparent border border-gray-600 text-gray-900 dark:text-white hover:border-red-500/50 hover:text-red-500" 
                        : "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {profile?.full_name || "User"}
                <UserBadge badge={profile?.badge} size={24} />
              </h2>
              <p className="text-gray-500 text-sm">@{profile?.username || "unknown"}</p>
              <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">{profile?.bio || "No bio available."}</p>
            </div>

            {/* --- META SECTION (WEBSITE FIX) --- */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-500 text-xs">
              <div className="flex items-center gap-1"><MapPin size={14} /> Philippines</div>
              
              {profile?.website && (
                <div className="flex items-center gap-1 hover:text-indigo-500 dark:hover:text-indigo-400 transition cursor-pointer">
                  <LinkIcon size={14} /> 
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline"
                  >
                    {profile.website
                      .replace(/^https?:\/\//, '')
                      .replace(/^www\./, '')
                      .split('/')[0]
                    }
                  </a>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

            <div className="grid grid-cols-3 text-center divide-x divide-gray-200 dark:divide-gray-800">
              <button onClick={() => openModal('following')} className="flex flex-col hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{followingCount}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Following</span>
              </button>
              <button onClick={() => openModal('followers')} className="flex flex-col hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{followersCount}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Followers</span>
              </button>
              <div className="flex flex-col py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{posts.length}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Posts</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white px-2">
            {isOwnProfile ? "Your Posts" : `${profile?.username || "User"}'s Posts`}
        </h3>
        
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id}
              post={{
                ...post,
                author: {
                  username: profile?.username || "User",
                  full_name: profile?.full_name || "User",
                  avatar_url: profile?.avatar_url || null,
                  border_variant: profile?.border_variant,
                  badge: profile?.badge
                }
              }}
              currentUserId={currentUser?.id}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1e212b] border border-gray-200 dark:border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-white font-bold capitalize">{modalType}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 p-1 rounded-full"><X size={18} /></button>
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
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition cursor-pointer">
                        <div className={`avatar-wrapper border-${u.border_variant || 'none'} p-[2px] rounded-full`}>
                            {u.avatar_url ? (
                            <img src={u.avatar_url} alt="Av" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#1e212b]" />
                            ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-white font-bold border-2 border-white dark:border-[#1e212b]">
                                {u.username?.[0] || <User size={16} />}
                            </div>
                            )}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-semibold text-sm flex items-center gap-1">
                            {u.full_name}
                            <UserBadge badge={u.badge} />
                          </p>
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