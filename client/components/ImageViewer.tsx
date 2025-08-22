import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  ExternalLink, 
  Download, 
  Share2, 
  Copy, 
  X,
  Calendar,
  User,
  FileText,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface ImageData {
  id: string;
  url: string;
  title: string;
  description?: string;
  date: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: {
    size?: string;
    dimensions?: string;
    format?: string;
    location?: string;
  };
}

interface ImageViewerProps {
  image: ImageData;
  children?: React.ReactNode;
  showDetails?: boolean;
  className?: string;
}

export default function ImageViewer({ 
  image, 
  children, 
  showDetails = true,
  className = "" 
}: ImageViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenInNewTab = () => {
    window.open(image.url, '_blank');
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.title || 'image'}.${image.metadata?.format || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully');
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: image.title,
          text: image.description || 'Check out this image',
          url: image.url,
        });
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(image.url);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share image');
    }
  };

  const copyImageLink = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      toast.success('Image link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const generateShareableLink = () => {
    // Create a shareable link with image ID
    const baseUrl = window.location.origin;
    return `${baseUrl}/image/${image.id}`;
  };

  return (
    <div className={`group relative ${className}`}>
      {/* Image Preview */}
      <div className="relative overflow-hidden rounded-lg border bg-muted/50">
        <img
          src={image.url}
          alt={image.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-white/90 text-black hover:bg-white"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleOpenInNewTab}
              className="bg-white/90 text-black hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Details */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          <h4 className="font-medium text-sm line-clamp-1">{image.title}</h4>
          {image.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {image.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(image.date).toLocaleDateString()}</span>
            {image.uploadedBy && (
              <>
                <User className="h-3 w-3" />
                <span>{image.uploadedBy}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal for Full View */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {image.title}
            </DialogTitle>
            <DialogDescription>
              {image.description || 'Image details and actions'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Display */}
            <div className="relative bg-muted/50 rounded-lg overflow-hidden">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleOpenInNewTab} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button onClick={handleDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Downloading...' : 'Download'}
              </Button>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={copyImageLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>

            {/* Image Metadata */}
            <div className="space-y-3">
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {image.metadata?.size && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Size</div>
                    <div>{image.metadata.size}</div>
                  </div>
                )}
                {image.metadata?.dimensions && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Dimensions</div>
                    <div>{image.metadata.dimensions}</div>
                  </div>
                )}
                {image.metadata?.format && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Format</div>
                    <div className="uppercase">{image.metadata.format}</div>
                  </div>
                )}
                {image.metadata?.location && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Location</div>
                    <div>{image.metadata.location}</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {image.tags && image.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Shareable Link */}
              <div className="space-y-2">
                <div className="font-medium text-sm text-muted-foreground">Shareable Link</div>
                <div className="flex gap-2">
                  <Input
                    value={generateShareableLink()}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={copyImageLink}
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}