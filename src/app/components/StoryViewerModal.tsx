"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type StoryViewerProps = {
  storyGroups: any[][]; // Array of Arrays (All users' stories)
  initialGroupIndex: number; // Where to start
  onClose: () => void;
};

export default function StoryViewerModal({ storyGroups, initialGroupIndex, onClose }: StoryViewerProps) {
  // Track BOTH the current user (group) and the current story
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  
  const pointerDownTimeRef = useRef<number>(0);
  
  const STORY_DURATION = 5000;

  // Get the active list of stories for the current user
  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.[currentStoryIndex];

  // Reset progress when switching stories OR groups
  useEffect(() => {
    setProgress(0);
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
    setIsPaused(false);
  }, [currentGroupIndex, currentStoryIndex]);

  // --- NAVIGATION LOGIC ---
  const goToNext = useCallback(() => {
    elapsedTimeRef.current = 0;
    setProgress(0);

    // 1. Is there another story in THIS user's group?
    if (currentStoryIndex < currentGroup.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } 
    // 2. If not, is there another USER group?
    else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0); // Start from their first story
    } 
    // 3. No more stories, no more users. Close.
    else {
      onClose();
    }
  }, [currentStoryIndex, currentGroupIndex, currentGroup.length, storyGroups.length, onClose]);

  const goToPrev = useCallback(() => {
    elapsedTimeRef.current = 0;
    setProgress(0);

    // 1. Is there a previous story in THIS user's group?
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } 
    // 2. If not, go to the PREVIOUS USER
    else if (currentGroupIndex > 0) {
      const prevGroupIndex = currentGroupIndex - 1;
      setCurrentGroupIndex(prevGroupIndex);
      // Jump to the LAST story of the previous user
      setCurrentStoryIndex(storyGroups[prevGroupIndex].length - 1);
    } 
    // 3. Start of everything? Just reset.
    else {
      startTimeRef.current = null;
    }
  }, [currentStoryIndex, currentGroupIndex, storyGroups]);

  // --- ANIMATION LOOP (Same as before) ---
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (isPaused) {
        startTimeRef.current = null;
        requestRef.current = requestAnimationFrame(animate);
        return;
      }
      if (startTimeRef.current === null) startTimeRef.current = timestamp - elapsedTimeRef.current;
      const elapsed = timestamp - startTimeRef.current;
      elapsedTimeRef.current = elapsed;

      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (elapsed < STORY_DURATION) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        goToNext();
      }
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPaused, goToNext]);

  // --- INTERACTION HANDLERS ---
  const handlePointerDown = () => {
    setIsPaused(true);
    pointerDownTimeRef.current = Date.now();
  };

  const handlePointerUp = (action: 'next' | 'prev') => {
    setIsPaused(false);
    if (Date.now() - pointerDownTimeRef.current < 200) {
      if (action === 'next') goToNext();
      if (action === 'prev') goToPrev();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col select-none">
        
        {/* SEGMENTED PROGRESS BAR */}
        <div className="absolute top-4 left-2 right-2 z-30 flex gap-1 h-1">
          {currentGroup.map((_, index) => (
            <div key={index} className="flex-1 bg-white/30 rounded-full overflow-hidden h-full">
              <div 
                className="h-full bg-white"
                style={{ 
                  width: index === currentStoryIndex ? `${progress}%` : 
                         index < currentStoryIndex ? '100%' : '0%'
                }} 
              />
            </div>
          ))}
        </div>

        {/* HEADER */}
        <div className="absolute top-8 left-4 right-16 z-30 flex items-center gap-3 pointer-events-none">
          <img src={currentStory.author?.avatar_url || "/default-avatar.png"} className="w-8 h-8 rounded-full border border-white/20 object-cover bg-gray-700" />
          <div className="flex flex-col drop-shadow-md">
             <span className="text-white font-bold text-sm truncate">{currentStory.author?.username || "User"}</span>
             <span className="text-white/80 text-[10px]">
               {currentStory.created_at ? formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true }) : "Just now"}
             </span>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button onClick={onClose} className="absolute top-8 right-4 text-white z-50 p-2 opacity-80 hover:opacity-100 bg-black/20 rounded-full backdrop-blur-sm">
          <X size={24} />
        </button>

        {/* NAVIGATION ZONES */}
        <div className="absolute inset-0 z-20 flex">
           <div className="flex-1 h-full cursor-pointer" onPointerDown={handlePointerDown} onPointerUp={() => handlePointerUp('prev')} onPointerLeave={() => setIsPaused(false)} />
           <div className="flex-1 h-full cursor-pointer" onPointerDown={handlePointerDown} onPointerUp={() => handlePointerUp('next')} onPointerLeave={() => setIsPaused(false)} />
        </div>

        {/* IMAGE */}
        <img 
          src={currentStory.image_url} 
          className="w-full h-full object-contain bg-black pointer-events-none" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        
        {/* PAUSE INDICATOR */}
        {isPaused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
             <div className="bg-black/40 px-4 py-2 rounded-full text-white text-xs backdrop-blur-md">Paused</div>
          </div>
        )}
      </div>
    </div>
  );
}