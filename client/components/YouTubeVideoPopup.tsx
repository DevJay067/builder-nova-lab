import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  X, 
  Minimize2, 
  Maximize2, 
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";

interface YouTubeVideoPopupProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  autoplay?: boolean;
}

export default function YouTubeVideoPopup({ 
  videoId, 
  title = "YouTube Video",
  thumbnail,
  autoplay = false 
}: YouTubeVideoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  
  const getVideoUrl = () => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: isMuted ? '1' : '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
    });
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = ((e.clientX - dragOffset.x) / window.innerWidth) * 100;
      const newY = ((e.clientY - dragOffset.y) / window.innerHeight) * 100;
      
      setPosition({
        x: Math.max(0, Math.min(newX, 70)), // Keep within bounds
        y: Math.max(0, Math.min(newY, 70)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) {
    return (
      <div className="relative group">
        <div 
          className="relative overflow-hidden rounded-lg cursor-pointer transform-smooth hover:scale-105 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <img 
            src={thumbnailUrl}
            alt={title}
            className="w-full h-32 sm:h-40 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform-smooth group-hover:scale-110">
              <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          
          {/* YouTube Logo */}
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
            YouTube
          </div>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* Floating Video Window */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          isMinimized ? 'w-64 h-16' : 'w-96 h-64'
        }`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          maxWidth: 'calc(100vw - 20px)',
          maxHeight: 'calc(100vh - 20px)',
        }}
      >
        <Card className="w-full h-full shadow-2xl border-2 border-border/50 overflow-hidden">
          {/* Window Header */}
          <div 
            className="flex items-center justify-between p-2 bg-muted/90 border-b cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium ml-2 truncate">
                {isMinimized ? title.slice(0, 20) + '...' : title}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Video Content */}
          {!isMinimized && (
            <CardContent className="p-0 h-full">
              <iframe
                src={getVideoUrl()}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </CardContent>
          )}
          
          {/* Minimized State */}
          {isMinimized && (
            <CardContent className="p-2 flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground">YouTube</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}

// Trigger Button Component
export function YouTubeVideoTrigger({ 
  videoId, 
  title = "Watch Video",
  buttonText = "Play Video",
  variant = "default",
  size = "default",
  className = ""
}: {
  videoId: string;
  title?: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowVideo(true)}
      >
        <Play className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
      
      {showVideo && (
        <YouTubeVideoPopup
          videoId={videoId}
          title={title}
          autoplay={true}
        />
      )}
    </>
  );
}
