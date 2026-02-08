"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type StoryViewerProps = {
  stories: any[]; 
  onClose: () => void;
};

export default function StoryViewerModal({ stories, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs for timing and animation
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0); // Track how many ms have passed for current story
  
  // Refs for touch interactions (Tap vs Hold)
  const pointerDownTimeRef = useRef<number>(0);
  const isPointerDownRef = useRef(false);

  const STORY_DURATION = 5000; 

  // 1. Reset state when switching stories
  useEffect(() => {
    setProgress(0);
    elapsedTimeRef.current = 0;
    startTimeRef.current = null;
    setIsPaused(false);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    // Prevent double-skipping
    elapsedTimeRef.current = 0;
    setProgress(0);
    
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose(); 
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    elapsedTimeRef.current = 0;
    setProgress(0);

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      // If at start, just reset progress
      startTimeRef.current = null;
    }
  }, [currentIndex]);

  // 2. The Main Animation Loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (isPaused) {
        // Just keep the loop alive but don't progress time
        startTimeRef.current = null; // Invalidate start time so it resets on resume
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      if (startTimeRef.current === null) {
        // Resuming or Starting: Set start time relative to how much time already elapsed
        startTimeRef.current = timestamp - elapsedTimeRef.current;
      }

      // Calculate elapsed time
      const elapsed = timestamp - startTimeRef.current;
      elapsedTimeRef.current = elapsed;

      // Calculate percentage
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (elapsed < STORY_DURATION) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        goToNext();
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused, goToNext]); // Removed 'progress' dependency to fix infinite loop

  // 3. Interaction Handlers (Distinguish Tap vs Hold)
  const handlePointerDown = () => {
    setIsPaused(true);
    isPointerDownRef.current = true;
    pointerDownTimeRef.current = Date.now();
  };

  const handlePointerUp = (action: 'next' | 'prev') => {
    setIsPaused(false);
    isPointerDownRef.current = false;
    
    const pressDuration = Date.now() - pointerDownTimeRef.current;

    // If held for less than 200ms, treat as a CLICK.
    // If held longer, treat as a PAUSE/RELEASE (do nothing).
    if (pressDuration < 200) {
      if (action === 'next') goToNext();
      if (action === 'prev') goToPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "Space") setIsPaused(p => !p); // Toggle pause
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-in zoom-in-95 duration-200">
      
      <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col select-none">
        
        {/* SEGMENTED PROGRESS BAR */}
        <div className="absolute top-4 left-2 right-2 z-30 flex gap-1 h-1">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 bg-white/30 rounded-full overflow-hidden h-full">
              <div 
                className="h-full bg-white transition-none ease-linear" // Remove transition for smoother updates
                style={{ 
                  width: index === currentIndex ? `${progress}%` : 
                         index < currentIndex ? '100%' : '0%'
                }} 
              />
            </div>
          ))}
        </div>

        {/* HEADER */}
        <div className="absolute top-8 left-4 right-16 z-30 flex items-center gap-3 pointer-events-none">
          <img 
            src={currentStory.author?.avatar_url || "/default-avatar.png"} 
            className="w-8 h-8 rounded-full border border-white/20 object-cover bg-gray-700" 
            alt={currentStory.author?.username || "User"}
          />
          <div className="flex flex-col drop-shadow-md">
             <span className="text-white font-bold text-sm truncate">
               {currentStory.author?.username || "User"}
             </span>
             <span className="text-white/80 text-[10px]">
               {currentStory.created_at 
                 ? formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true }) 
                 : "Just now"}
             </span>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-8 right-4 text-white z-50 p-2 opacity-80 hover:opacity-100 bg-black/20 rounded-full backdrop-blur-sm cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* NAVIGATION ZONES */}
        <div className="absolute inset-0 z-20 flex">
           {/* Previous Zone */}
           <div 
             className="flex-1 h-full cursor-pointer" 
             onPointerDown={handlePointerDown}
             onPointerUp={() => handlePointerUp('prev')}
             onPointerLeave={() => setIsPaused(false)}
           />
           {/* Next Zone */}
           <div 
             className="flex-1 h-full cursor-pointer" 
             onPointerDown={handlePointerDown}
             onPointerUp={() => handlePointerUp('next')}
             onPointerLeave={() => setIsPaused(false)}
           />
        </div>

        {/* NAVIGATION HINTS (Only on first story, early progress) */}
        {currentIndex === 0 && progress < 10 && !isPaused && (
          <>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-30 pointer-events-none animate-pulse">
              <ChevronLeft size={48} className="text-white" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-30 pointer-events-none animate-pulse">
              <ChevronRight size={48} className="text-white" />
            </div>
          </>
        )}

        {/* THE IMAGE */}
        <img 
          src={currentStory.image_url} 
          className="w-full h-full object-contain bg-black pointer-events-none" 
          alt="Story content"
          onError={(e) => {
             e.currentTarget.style.display = 'none'; // Hide broken image
          }}
        />
        
        {/* Pause Overlay Indicator */}
        {isPaused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
             
          </div>
        )}
        
      </div>
    </div>
  );
}