"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/app/lib/supabaseClient"; 
import { useRouter } from "next/navigation";
import CommentModal from "@/app/components/CommentModal";
import PostCard, { Post } from "@/app/components/PostCard"; 
import UserBadge from "@/app/components/UserBadge"; 
import Link from "next/link"; 
import { MapPin, Link as LinkIcon, Calendar, Edit3, Loader2, Camera, Save, X, User } from 'lucide-react';

// 👇 1. CLOUDINARY CONFIG (Replace these!)
const CLOUD_NAME = "dfi0obvzn"; 
const UPLOAD_PRESET = "Images"; 

// 👇 2. FAKE FOLLOWER CHEAT (Your ID)
const MY_ID = "5beae274-f926-473a-9475-a49cce64e428"; 

// --- HELPER: Upload to Cloudinary ---
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");
    
    return data.secure_url; // Returns the HTTP URL
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
};

// --- HELPER: Format Numbers ---
const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
};

type ProfileData = {
  id?: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  border_variant?: string; 
  badge?: string | null; 
};

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [activePostId, setActivePostId] = useState<string | null>(null);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<ProfileData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
    website: "",
    border_variant: "none",
    badge: null,
  });

  const router = useRouter();

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        const emailName = user.email?.split('@')[0] || "user";
        setProfile(prev => ({ ...prev, username: emailName, full_name: emailName }));
      }

      // Fetch Posts
      const { data: postData } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
        
      if (postData) setPosts(postData);

      // Fetch Stats
      const { count: followers } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("following_id", user.id);
      
      // Fake Follower Logic
      if (user.id === MY_ID) {
        setFollowersCount((followers || 0) + 10000); 
      } else {
        setFollowersCount(followers || 0);
      }

      const { count: following } = await supabase.from("follows").select("*", { count: 'exact', head: true }).eq("follower_id", user.id);
      setFollowingCount(following || 0);

      setLoading(false);
    }
    getData();
  }, [router]);

  const openModal = async (type: 'followers' | 'following') => {
    setModalType(type);
    setShowModal(true);
    setModalLoading(true);
    setModalUsers([]);

    try {
      let userIds: string[] = [];
      if (type === 'followers') {
        const { data } = await supabase.from('follows').select('follower_id').eq('following_id', user.id);
        userIds = data?.map(d => d.follower_id) || [];
      } else {
        const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
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

  // 👇 3. UPDATED UPLOAD FUNCTION (Uses Cloudinary)
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      
      // Optional: Check size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large! Please upload under 5MB.");
        setUploading(false);
        return;
      }

      // A. Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // B. Save URL to Supabase Database (profiles table)
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id);

      if (error) throw error;

      // C. Update Local State
      setProfile({ ...profile, avatar_url: imageUrl });
      
    } catch (error) {
      console.error(error);
      alert('Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { badge, ...restOfProfile } = profile;
      const updates = { 
        id: user.id, 
        ...restOfProfile, 
        updated_at: new Date() 
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      alert('Error updating!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-400" size={32} />
    </div>
  );

  const joinedDate = new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-200 p-4 font-sans transition-colors">
      
      <div className="w-full max-w-lg flex flex-col gap-6 mt-10 mb-24">
        
        <div className="bg-white dark:bg-[#1e212b] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative transition-colors">
          <div className="h-32 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 relative"></div>

          <div className="px-6 pb-6">
            <div className="flex justify-between items-start">
              
              <div className="relative -mt-12 group">
                <div className="p-1 bg-white dark:bg-[#1e212b] rounded-full inline-block relative transition-colors">
                  <div className={`avatar-wrapper border-${profile.border_variant || 'none'}`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1e212b] shadow-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-[#1e212b] shadow-lg">
                        {profile.username ? profile.username[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute inset-0 mb-2 flex items-center justify-center bg-black/50 rounded-full cursor-pointer hover:bg-black/60 transition-colors z-10">
                      {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                      <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-bold flex items-center gap-1"><X size={14} /> Cancel</button>
                    <button onClick={updateProfile} className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-bold flex items-center gap-1"><Save size={14} /> Save</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold rounded-full border border-gray-300 dark:border-gray-700 flex items-center gap-2 transition-colors"><Edit3 size={14} /> Edit Profile</button>
                )}
              </div>
            </div>

            <div className="mt-3">
              {isEditing ? (
                <div className="flex flex-col gap-3 animate-in fade-in">
                  
                  {/* Inputs with Limits */}
                  <input 
                    type="text" 
                    maxLength={30} 
                    value={profile.full_name || ""} 
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} 
                    placeholder="Display Name" 
                    className="bg-gray-100 dark:bg-black/20 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white font-bold text-xl outline-none" 
                  />
                  
                  <input 
                    type="text" 
                    maxLength={20} 
                    value={profile.username || ""} 
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })} 
                    placeholder="Username" 
                    className="bg-gray-100 dark:bg-black/20 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-600 dark:text-gray-400 text-sm outline-none" 
                  />
                  
                  <div className="relative">
                    <textarea 
                      maxLength={150} 
                      value={profile.bio || ""} 
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                      placeholder="Bio..." 
                      className="w-full bg-gray-100 dark:bg-black/20 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-700 dark:text-gray-300 text-sm outline-none resize-none h-24" 
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                      {(profile.bio?.length || 0)}/150
                    </span>
                  </div>

                  <input maxLength={200} type="text" value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="Website" className="bg-gray-100 dark:bg-black/20 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-500 text-xs outline-none" />
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wide">Avatar Border Style</span>
                    <div className="flex gap-2 flex-wrap">
                      {['none', 'rainbow', 'gold', 'neon', 'fire', 'galaxy', 'glitch', 'ghost'].map((variant) => (
                        <button
                          key={variant}
                          onClick={() => setProfile({ ...profile, border_variant: variant })}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all capitalize
                            ${profile.border_variant === variant 
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-md ring-1 ring-cyan-500' 
                              : 'border-gray-300 dark:border-gray-700 text-gray-500 hover:border-gray-400'}
                          `}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {profile.full_name || "User"}
                    <UserBadge badge={profile.badge} size={24}/>
                  </h2>
                  <p className="text-gray-500 text-sm">@{profile.username || "username"}</p>
                  <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">{profile.bio || "No bio yet."}</p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-500 text-xs">
              <div className="flex items-center gap-1"><MapPin size={14} /> Philippines</div>
              <div className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"><LinkIcon size={14} /> {profile.website ? <a href={profile.website} target="_blank">{profile.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}</a> : 'No website'}</div>
              <div className="flex items-center gap-1"><Calendar size={14} /> Joined {joinedDate}</div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

            <div className="grid grid-cols-3 text-center divide-x divide-gray-200 dark:divide-gray-800">
              <button onClick={() => openModal('following')} className="flex flex-col hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{formatCount(followingCount)}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Following</span>
              </button>
              <button onClick={() => openModal('followers')} className="flex flex-col hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{formatCount(followersCount)}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Followers</span>
              </button>
              <div className="flex flex-col py-1">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{formatCount(posts.length)}</span>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Posts</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white px-2">Your Posts</h3>
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id}
              post={{
                ...post, 
                author: {
                    username: profile.username,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    border_variant: profile.border_variant,
                    badge: profile.badge 
                }
              }}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onCommentClick={setActivePostId}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
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
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="Av" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-white font-bold">
                            {u.username?.[0] || <User size={16} />}
                          </div>
                        )}
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
          currentUserId={user?.id} 
          onClose={() => setActivePostId(null)} 
        />
      )}

    </main>
  );
}