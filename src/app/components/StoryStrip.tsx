"use client";

import { Plus, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

type StoryStripProps = {
  groupedStories: any[][];
  currentUser: any;
  onAddStory: () => void;
  onViewStory: (index: number) => void; 
};

export default function StoryStrip({ groupedStories, currentUser, onAddStory, onViewStory }: StoryStripProps) {
  // 1. State to track viewed author IDs
  const [viewedAuthors, setViewedAuthors] = useState<Set<string>>(new Set());

  // 2. Load viewed stories from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("viewed_stories");
    if (stored) {
      setViewedAuthors(new Set(JSON.parse(stored)));
    }
  }, []);

  // 3. Mark a story as viewed when clicked
  const handleStoryClick = (authorId: string, originalGroup: any[]) => {
    // Add to state
    const newSet = new Set(viewedAuthors);
    newSet.add(authorId);
    setViewedAuthors(newSet);
    
    // Save to LocalStorage
    localStorage.setItem("viewed_stories", JSON.stringify(Array.from(newSet)));

    // IMPORTANT: Find the index in the ORIGINAL (unsorted) array to pass to the viewer
    const originalIndex = groupedStories.indexOf(originalGroup);
    onViewStory(originalIndex);
  };

  // 4. Sort Stories: Unseen first, Seen last
  const sortedStories = useMemo(() => {
    const unseen: any[][] = [];
    const seen: any[][] = [];

    groupedStories.forEach((group) => {
      const authorId = group[0].author_id;
      if (viewedAuthors.has(authorId)) {
        seen.push(group);
      } else {
        unseen.push(group);
      }
    });

    return [...unseen, ...seen];
  }, [groupedStories, viewedAuthors]);

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar w-full px-2">
      
      {/* ADD STORY BUTTON (Always first) */}
      <div onClick={onAddStory} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-cyan-500 transition-all overflow-hidden">
             {currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url ? (
               <img src={currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
             ) : <User className="text-gray-400" />}
          </div>
          <div className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1 border-2 border-white dark:border-[#0f1117]">
            <Plus size={12} className="text-white" strokeWidth={4} />
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Your Story</span>
      </div>

      {/* RENDER SORTED GROUPS */}
      {sortedStories.map((group) => {
        const author = group[0].author;
        const authorId = group[0].author_id;
        const isViewed = viewedAuthors.has(authorId);

        return (
          <div 
             key={authorId} 
             onClick={() => handleStoryClick(authorId, group)} 
             className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer transition-transform active:scale-95"
          >
            {/* CONDITIONAL BORDER LOGIC: 
                If viewed: Gray background, no gradient.
                If new: Colorful gradient.
            */}
            <div className={`p-[2.5px] rounded-full ${
              isViewed 
                ? "bg-gray-300 dark:bg-gray-700" // Gray for viewed
                : "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600" // Color for new
            }`}>
              <div className="p-[2px] bg-white dark:bg-[#0f1117] rounded-full">
                <img 
                  src={author?.avatar_url || "/default-avatar.png"} 
                  className={`w-14 h-14 rounded-full object-cover border ${
                    isViewed ? "border-gray-300 dark:border-gray-700 grayscale-[0.5]" : "border-gray-100 dark:border-gray-800"
                  }`}
                />
              </div>
            </div>
            
            <span className={`text-[10px] font-semibold truncate w-16 text-center ${
              isViewed ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"
            }`}>
              {author?.username || "User"}
            </span>
          </div>
        );
      })}
    </div>
  );
}