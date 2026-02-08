"use client";

import { Plus, User } from "lucide-react";
import { useMemo } from "react";

type StoryStripProps = {
  stories: any[];
  currentUser: any;
  onAddStory: () => void;
  onViewStory: (stories: any[]) => void; // Updated to accept an ARRAY of stories
};

export default function StoryStrip({ stories, currentUser, onAddStory, onViewStory }: StoryStripProps) {
  
  // 1. Group stories by Author ID
  const groupedStories = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    stories.forEach((story) => {
      if (!groups[story.author_id]) {
        groups[story.author_id] = [];
      }
      groups[story.author_id].push(story);
    });

    // Convert object to array and sort by latest story
    return Object.values(groups).sort((a, b) => 
      new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
    );
  }, [stories]);

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar w-full px-2">
      
      {/* ADD STORY BUTTON */}
      <div 
        onClick={onAddStory}
        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-cyan-500 transition-all overflow-hidden">
             {currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url ? (
               <img 
                 src={currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url} 
                 className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                 alt="Me"
               />
             ) : (
               <User className="text-gray-400" />
             )}
          </div>
          <div className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1 border-2 border-white dark:border-[#0f1117]">
            <Plus size={12} className="text-white" strokeWidth={4} />
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Your Story</span>
      </div>

      {/* RENDER GROUPED STORIES */}
      {groupedStories.map((userStories) => {
        const author = userStories[0].author;
        return (
          <div 
             key={userStories[0].author_id} 
             onClick={() => onViewStory(userStories)} // Pass ALL stories for this user
             className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer transition-transform active:scale-95"
          >
            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <div className="p-[2px] bg-white dark:bg-[#0f1117] rounded-full">
                <img 
                  src={author?.avatar_url || "/default-avatar.png"} 
                  className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                  alt={author?.username}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-700 dark:text-gray-400 font-semibold truncate w-16 text-center">
              {author?.username || "User"}
            </span>
          </div>
        );
      })}
    </div>
  );
}