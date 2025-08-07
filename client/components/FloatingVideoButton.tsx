import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Video } from "lucide-react";
import YouTubeVideoPopup from "./YouTubeVideoPopup";

interface FloatingVideoButtonProps {
  videoId: string;
  title?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export default function FloatingVideoButton({
  videoId,
  title = "Demo Video",
  position = "bottom-right"
}: FloatingVideoButtonProps) {
  const [showVideo, setShowVideo] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-right":
        return "bottom-6 right-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "top-left":
        return "top-6 left-6";
      default:
        return "bottom-6 right-6";
    }
  };

  return (
    <>
      {/* Floating Video Button */}
      <div className={`fixed ${getPositionClasses()} z-40`}>
        <Button
          size="lg"
          className="rounded-full w-16 h-16 shadow-2xl hover:scale-110 transition-all duration-300 bg-red-600 hover:bg-red-700 border-4 border-white/20"
          onClick={() => setShowVideo(true)}
        >
          <Play className="w-6 h-6" fill="currentColor" />
        </Button>
        
        {/* Tooltip */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Watch Demo
        </div>
      </div>

      {/* Video Popup */}
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
