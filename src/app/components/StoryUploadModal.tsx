"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { X, Loader2, Type, Image as ImageIcon, Palette, ZoomIn, Move, Maximize2 } from "lucide-react";

export default function StoryUploadModal({ onClose, onUploadSuccess, currentUserId }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- Text State ---
  const [text, setText] = useState("");
  const [showTextTools, setShowTextTools] = useState(false);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const [fontSize, setFontSize] = useState(48);
  const [isDraggingText, setIsDraggingText] = useState(false);

  // --- Image State ---
  const [showImageTools, setShowImageTools] = useState(false);
  const [imageScale, setImageScale] = useState(100);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#000000");

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const textColors = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
  
  const backgroundColors = [
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
    { name: "Gradient Blue", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { name: "Gradient Pink", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { name: "Gradient Green", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { name: "Gradient Orange", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
    { name: "Gradient Purple", value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
    { name: "Gradient Sunset", value: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)" },
  ];

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // --- Text Dragging ---
  const handleTextMouseDown = (e: React.MouseEvent) => {
    if (!text) return;
    e.stopPropagation();
    setIsDraggingText(true);
  };

  const handleTextTouchStart = (e: React.TouchEvent) => {
    if (!text) return;
    e.stopPropagation();
    setIsDraggingText(true);
  };

  // --- Image Dragging ---
  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  // --- Universal Move Handler ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewContainerRef.current) return;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (isDraggingText) {
      setTextX(Math.max(0, Math.min(100, x)));
      setTextY(Math.max(0, Math.min(100, y)));
    } else if (isDraggingImage) {
      setImageX(Math.max(0, Math.min(100, x)));
      setImageY(Math.max(0, Math.min(100, y)));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!previewContainerRef.current) return;
    
    const touch = e.touches[0];
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    if (isDraggingText) {
      setTextX(Math.max(0, Math.min(100, x)));
      setTextY(Math.max(0, Math.min(100, y)));
    } else if (isDraggingImage) {
      setImageX(Math.max(0, Math.min(100, x)));
      setImageY(Math.max(0, Math.min(100, y)));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingText(false);
    setIsDraggingImage(false);
  };

  // --- Generate Composite Image ---
  const generateCompositeImage = async (): Promise<Blob | null> => {
    if (!file || !preview) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.src = preview;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        // Standard story dimensions (9:16)
        const storyWidth = 1080;
        const storyHeight = 1920;
        canvas.width = storyWidth;
        canvas.height = storyHeight;

        // Draw background
        if (backgroundColor.startsWith('linear-gradient')) {
          // Parse gradient for canvas
          const gradient = ctx.createLinearGradient(0, 0, storyWidth, storyHeight);
          // Simple gradient approximation
          if (backgroundColor.includes('#667eea')) {
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
          } else if (backgroundColor.includes('#f093fb')) {
            gradient.addColorStop(0, '#f093fb');
            gradient.addColorStop(1, '#f5576c');
          } else if (backgroundColor.includes('#4facfe')) {
            gradient.addColorStop(0, '#4facfe');
            gradient.addColorStop(1, '#00f2fe');
          } else if (backgroundColor.includes('#fa709a')) {
            gradient.addColorStop(0, '#fa709a');
            gradient.addColorStop(1, '#fee140');
          } else if (backgroundColor.includes('#a8edea')) {
            gradient.addColorStop(0, '#a8edea');
            gradient.addColorStop(1, '#fed6e3');
          } else if (backgroundColor.includes('#ff9a56')) {
            gradient.addColorStop(0, '#ff9a56');
            gradient.addColorStop(1, '#ff6a88');
          }
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = backgroundColor;
        }
        ctx.fillRect(0, 0, storyWidth, storyHeight);

        // Calculate scaled image dimensions
        const scale = imageScale / 100;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Position based on imageX and imageY
        const xPos = (storyWidth * imageX / 100) - (scaledWidth / 2);
        const yPos = (storyHeight * imageY / 100) - (scaledHeight / 2);

        // Draw image
        ctx.drawImage(img, xPos, yPos, scaledWidth, scaledHeight);

        // Draw text
        if (text.trim()) {
          const scaledFontSize = (fontSize / 400) * storyWidth;
          ctx.font = `bold ${scaledFontSize}px sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          const textXPos = (storyWidth * textX) / 100;
          const textYPos = (storyHeight * textY) / 100;
          
          ctx.fillText(text, textXPos, textYPos);
        }

        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg", 0.95);
      };
    });
  };

  const handleUpload = async () => {
    if (!file || !currentUserId) return;
    setUploading(true);

    try {
      const finalBlob = await generateCompositeImage();
      if (!finalBlob) throw new Error("Failed to process image");

      const fileExt = "jpg";
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, finalBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          author_id: currentUserId,
          image_url: publicUrl
        });

      if (dbError) throw dbError;

      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to upload story.");
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setText("");
    setTextX(50);
    setTextY(50);
    setFontSize(48);
    setImageScale(100);
    setImageX(50);
    setImageY(50);
    setBackgroundColor("#000000");
    setShowTextTools(false);
    setShowImageTools(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-sm h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col border border-gray-800">
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          
          {preview && (
            <div className="flex gap-2">
              {/* Image Tools Button */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowImageTools(!showImageTools);
                    setShowTextTools(false);
                  }}
                  className={`p-2 rounded-full transition-colors ${showImageTools ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <Maximize2 size={20} />
                </button>
                
                {/* IMAGE TOOLS DROPDOWN */}
                {showImageTools && (
                  <div className="absolute top-12 right-0 w-72 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl animate-in slide-in-from-top-2 z-50">
                    
                    {/* Image Scale */}
                    <div className="mb-4">
                      <label className="text-white/60 text-xs mb-2 block flex items-center gap-2">
                        <ZoomIn size={14} />
                        Scale: {imageScale}%
                      </label>
                      <input 
                        type="range" 
                        min="50" 
                        max="150" 
                        value={imageScale}
                        onChange={(e) => setImageScale(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* Background Colors */}
                    <div className="mb-3">
                      <label className="text-white/60 text-xs mb-2 block flex items-center gap-2">
                        <Palette size={14} />
                        Background
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {backgroundColors.map((bg) => (
                          <button 
                            key={bg.name}
                            onClick={() => setBackgroundColor(bg.value)}
                            className={`h-10 rounded-lg border-2 ${backgroundColor === bg.value ? 'border-white scale-105' : 'border-white/20 hover:scale-105'} transition-transform overflow-hidden`}
                            style={{ background: bg.value }}
                            title={bg.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-white/40 text-xs flex items-center gap-1 mt-3 pt-3 border-t border-white/10">
                      <Move size={12} />
                      Drag image to reposition
                    </div>
                  </div>
                )}
              </div>

              {/* Text Tools Button */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowTextTools(!showTextTools);
                    setShowImageTools(false);
                  }}
                  className={`p-2 rounded-full transition-colors ${showTextTools ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <Type size={20} />
                </button>
                
                {/* TEXT TOOLS DROPDOWN */}
                {showTextTools && (
                  <div className="absolute top-12 right-0 w-72 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl animate-in slide-in-from-top-2 z-50">
                    
                    {/* Text Input */}
                    <div className="mb-4">
                      <label className="text-white/60 text-xs mb-2 block">Caption</label>
                      <input 
                        type="text" 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your caption..."
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {/* Font Size */}
                    <div className="mb-4">
                      <label className="text-white/60 text-xs mb-2 block flex items-center gap-2">
                        <ZoomIn size={14} />
                        Size: {fontSize}px
                      </label>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    
                    {/* Color Picker */}
                    <div className="mb-3">
                      <label className="text-white/60 text-xs mb-2 block flex items-center gap-2">
                        <Palette size={14} />
                        Color
                      </label>
                      <div className="flex justify-between gap-2">
                        {textColors.map(c => (
                          <button 
                            key={c}
                            onClick={() => setTextColor(c)}
                            className={`w-8 h-8 rounded-full border-2 ${textColor === c ? 'border-white scale-110' : 'border-white/20 hover:scale-110'} transition-transform`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-white/40 text-xs flex items-center gap-1 mt-3 pt-3 border-t border-white/10">
                      <Move size={12} />
                      Drag text on image to reposition
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MAIN PREVIEW AREA */}
        <div 
          ref={previewContainerRef}
          className="flex-1 relative overflow-hidden"
          style={{ background: backgroundColor }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {!preview ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mb-6">Share a moment with your friends</p>
                <label className="cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-lg shadow-cyan-500/20">
                  Select from Gallery
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Draggable/Scalable Image */}
              <img 
                src={preview} 
                className={`absolute ${isDraggingImage ? 'cursor-grabbing' : 'cursor-grab'} object-contain`}
                alt="Preview"
                style={{
                  left: `${imageX}%`,
                  top: `${imageY}%`,
                  transform: `translate(-50%, -50%) scale(${imageScale / 100})`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onMouseDown={handleImageMouseDown}
                onTouchStart={handleImageTouchStart}
                draggable={false}
              />
              
              {/* Draggable Text Overlay */}
              {text && (
                <div 
                  className={`absolute ${isDraggingText ? 'cursor-grabbing' : 'cursor-grab'} transition-transform hover:scale-105 z-10`}
                  style={{ 
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: 'translate(-50%, -50%)',
                    color: textColor,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.2,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    maxWidth: '90%',
                    textAlign: 'center',
                  }}
                  onMouseDown={handleTextMouseDown}
                  onTouchStart={handleTextTouchStart}
                >
                  {text}
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        {preview && (
          <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-between items-center gap-4 z-20">
            <button 
              onClick={resetAll}
              className="text-white/70 hover:text-white text-sm font-medium"
            >
              Discard
            </button>

            <button 
              onClick={handleUpload} 
              disabled={uploading}
              className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {uploading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  Share to Story
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}