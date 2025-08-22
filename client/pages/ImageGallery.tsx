import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Share2,
  Plus,
  Calendar,
  Tag,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import ImageViewer from '@/components/ImageViewer';

interface ImageData {
  id: string;
  url: string;
  title: string;
  description?: string;
  date: string;
  uploadedBy?: string;
  tags?: string[];
  category?: string;
  metadata?: {
    size?: string;
    dimensions?: string;
    format?: string;
    location?: string;
  };
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockImages: ImageData[] = [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
        title: 'X-Ray Scan Results',
        description: 'Chest X-ray showing normal lung fields',
        date: '2024-01-15',
        uploadedBy: 'Dr. Smith',
        category: 'medical',
        tags: ['x-ray', 'chest', 'lungs'],
        metadata: {
          size: '2.4 MB',
          dimensions: '2048x1536',
          format: 'jpg',
          location: 'Radiology Department'
        }
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
        title: 'Blood Test Results',
        description: 'Complete blood count analysis report',
        date: '2024-01-10',
        uploadedBy: 'Lab Tech Johnson',
        category: 'laboratory',
        tags: ['blood', 'test', 'cbc'],
        metadata: {
          size: '1.8 MB',
          dimensions: '1920x1080',
          format: 'png',
          location: 'Laboratory'
        }
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
        title: 'MRI Scan',
        description: 'Brain MRI showing normal anatomy',
        date: '2024-01-08',
        uploadedBy: 'Dr. Williams',
        category: 'medical',
        tags: ['mri', 'brain', 'scan'],
        metadata: {
          size: '15.2 MB',
          dimensions: '2560x1920',
          format: 'dicom',
          location: 'Radiology Department'
        }
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
        title: 'ECG Results',
        description: 'Electrocardiogram showing normal sinus rhythm',
        date: '2024-01-05',
        uploadedBy: 'Cardiology Tech',
        category: 'cardiology',
        tags: ['ecg', 'heart', 'rhythm'],
        metadata: {
          size: '3.1 MB',
          dimensions: '1600x1200',
          format: 'pdf',
          location: 'Cardiology Department'
        }
      }
    ];

    setImages(mockImages);
    setFilteredImages(mockImages);
    setIsLoading(false);
  }, []);

  // Filter and search images
  useEffect(() => {
    let filtered = images;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        image =>
          image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          image.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
          image.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(image => image.category === selectedCategory);
    }

    // Format filter
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(image => image.metadata?.format === selectedFormat);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'size':
          return (parseFloat(a.metadata?.size || '0') - parseFloat(b.metadata?.size || '0'));
        default:
          return 0;
      }
    });

    setFilteredImages(filtered);
  }, [images, searchTerm, selectedCategory, selectedFormat, sortBy]);

  const categories = ['all', 'medical', 'laboratory', 'cardiology', 'radiology'];
  const formats = ['all', 'jpg', 'png', 'pdf', 'dicom'];

  const handleBulkDownload = () => {
    // Implement bulk download functionality
    toast.info('Bulk download feature coming soon');
  };

  const handleBulkShare = () => {
    // Implement bulk share functionality
    toast.info('Bulk share feature coming soon');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Image Gallery</h1>
            <p className="text-muted-foreground">
              View and manage all your saved medical images and documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBulkDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Bulk Download
            </Button>
            <Button onClick={handleBulkShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Bulk Share
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format === 'all' ? 'All Formats' : format.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {filteredImages.length} of {images.length} images
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {filteredImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No images found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your search criteria or upload new images
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredImages.map((image) => (
                <div key={image.id} className={viewMode === 'list' ? 'w-full' : ''}>
                  <ImageViewer 
                    image={image} 
                    showDetails={true}
                    className={viewMode === 'list' ? 'flex gap-4' : ''}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}