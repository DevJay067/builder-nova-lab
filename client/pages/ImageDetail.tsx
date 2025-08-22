import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Tag,
  MapPin,
  HardDrive,
  Monitor,
  Image as ImageIcon,
  Edit,
  Trash2,
  Heart,
  Bookmark,
  MoreHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageData {
  id: string;
  url: string;
  title: string;
  description?: string;
  date: string;
  uploadedBy?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  metadata?: {
    size?: string;
    dimensions?: string;
    format?: string;
    location?: string;
    device?: string;
    software?: string;
    colorSpace?: string;
    compression?: string;
  };
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canDownload?: boolean;
  };
}

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [image, setImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    if (!id) return;

    const mockImage: ImageData = {
      id: id,
      url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      title: 'X-Ray Scan Results',
      description: 'Chest X-ray showing normal lung fields with clear visualization of the cardiac silhouette and clear costophrenic angles. No evidence of active disease process.',
      date: '2024-01-15',
      uploadedBy: 'Dr. Smith',
      category: 'medical',
      tags: ['x-ray', 'chest', 'lungs', 'radiology', 'diagnostic'],
      isPublic: false,
      isFavorite: true,
      isBookmarked: false,
      metadata: {
        size: '2.4 MB',
        dimensions: '2048x1536',
        format: 'jpg',
        location: 'Radiology Department',
        device: 'Siemens Ysio Max',
        software: 'Syngo.via VB30A',
        colorSpace: 'sRGB',
        compression: 'JPEG 90%'
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true,
        canDownload: true
      }
    };

    setImage(mockImage);
    setEditedTitle(mockImage.title);
    setEditedDescription(mockImage.description || '');
    setEditedTags(mockImage.tags?.join(', ') || '');
    setIsPublic(mockImage.isPublic || false);
    setIsFavorite(mockImage.isFavorite || false);
    setIsBookmarked(mockImage.isBookmarked || false);
    setIsLoading(false);
  }, [id]);

  const handleDownload = async () => {
    if (!image) return;
    
    try {
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
    }
  };

  const handleShare = async () => {
    if (!image) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: image.title,
          text: image.description || 'Check out this image',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share image');
    }
  };

  const copyImageLink = async () => {
    if (!image) return;
    
    try {
      await navigator.clipboard.writeText(image.url);
      toast.success('Direct image link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openInNewTab = () => {
    if (!image) return;
    window.open(image.url, '_blank');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const togglePublic = () => {
    setIsPublic(!isPublic);
    toast.success(isPublic ? 'Image is now private' : 'Image is now public');
  };

  const handleSave = () => {
    if (!image) return;
    
    // Here you would typically make an API call to update the image
    setImage({
      ...image,
      title: editedTitle,
      description: editedDescription,
      tags: editedTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublic: isPublic
    });
    
    setIsEditing(false);
    toast.success('Image updated successfully');
  };

  const handleCancel = () => {
    if (!image) return;
    
    setEditedTitle(image.title);
    setEditedDescription(image.description || '');
    setEditedTags(image.tags?.join(', ') || '');
    setIsPublic(image.isPublic || false);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Image not found</h2>
          <p className="text-muted-foreground mb-4">The image you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/gallery')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{image.title}</h1>
              <p className="text-muted-foreground">
                Uploaded on {new Date(image.date).toLocaleDateString()} by {image.uploadedBy}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={toggleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              onClick={toggleBookmark}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              onClick={togglePublic}
            >
              {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            {image.permissions?.canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-muted/50 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={openInNewTab} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              {image.permissions?.canDownload && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {image.permissions?.canShare && (
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <Button onClick={copyImageLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Direct Link
              </Button>
            </div>
          </div>

          {/* Sidebar - Details and Metadata */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Image Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={editedTags}
                        onChange={(e) => setEditedTags(e.target.value)}
                        placeholder="x-ray, chest, lungs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1">
                        Save Changes
                      </Button>
                      <Button onClick={handleCancel} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium">{image.title}</h3>
                      {image.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {image.description}
                        </p>
                      )}
                    </div>
                    
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {image.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(image.date).toLocaleDateString()}</span>
                      </div>
                      {image.uploadedBy && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{image.uploadedBy}</span>
                        </div>
                      )}
                      {image.category && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{image.category}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Technical Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {image.metadata && (
                  <>
                    {image.metadata.size && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">File Size</span>
                        <span className="text-sm font-medium">{image.metadata.size}</span>
                      </div>
                    )}
                    {image.metadata.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Dimensions</span>
                        <span className="text-sm font-medium">{image.metadata.dimensions}</span>
                      </div>
                    )}
                    {image.metadata.format && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Format</span>
                        <span className="text-sm font-medium uppercase">{image.metadata.format}</span>
                      </div>
                    )}
                    {image.metadata.device && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Device</span>
                        <span className="text-sm font-medium">{image.metadata.device}</span>
                      </div>
                    )}
                    {image.metadata.software && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Software</span>
                        <span className="text-sm font-medium">{image.metadata.software}</span>
                      </div>
                    )}
                    {image.metadata.colorSpace && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Color Space</span>
                        <span className="text-sm font-medium">{image.metadata.colorSpace}</span>
                      </div>
                    )}
                    {image.metadata.compression && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Compression</span>
                        <span className="text-sm font-medium">{image.metadata.compression}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Info */}
            {image.metadata?.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{image.metadata.location}</p>
                </CardContent>
              </Card>
            )}

            {/* Shareable Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Shareable Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={window.location.href}
                  readOnly
                  className="text-xs"
                />
                <Button onClick={handleShare} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share This Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}