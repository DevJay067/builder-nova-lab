import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ImageViewer from '@/components/ImageViewer';
import { ImageData } from '@/lib/imageUtils';

export default function ImageDemo() {
  // Sample images for demonstration
  const sampleImages: ImageData[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      title: 'X-Ray Scan Results',
      description: 'Chest X-ray showing normal lung fields',
      date: '2024-01-15',
      uploadedBy: 'Dr. Smith',
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
      tags: ['mri', 'brain', 'scan'],
      metadata: {
        size: '15.2 MB',
        dimensions: '2560x1920',
        format: 'dicom',
        location: 'Radiology Department'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Image Viewer Demo</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This page demonstrates the various ways users can view, interact with, and share saved images.
            Each image below shows different viewing options and functionality.
          </p>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Features Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Viewing Options</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Modal/lightbox view</li>
                  <li>• Open in new tab</li>
                  <li>• Full-screen display</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Sharing & Links</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Shareable page links</li>
                  <li>• Direct image links</li>
                  <li>• Copy to clipboard</li>
                  <li>• Native sharing API</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Actions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Download images</li>
                  <li>• Edit metadata</li>
                  <li>• Add to favorites</li>
                  <li>• Set visibility</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Usage Examples</h2>
          
          {/* Example 1: Basic Image Viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Example 1</Badge>
                Basic Image Viewer with Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hover over the image to see action buttons. Click "View" to open the modal with full details.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleImages.map((image) => (
                  <ImageViewer 
                    key={image.id} 
                    image={image} 
                    showDetails={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Example 2: Compact View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Example 2</Badge>
                Compact View (No Details)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Images displayed without description text, useful for grid layouts.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sampleImages.map((image) => (
                  <ImageViewer 
                    key={image.id} 
                    image={image} 
                    showDetails={false}
                    className="aspect-square"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Example 3: Custom Styling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Example 3</Badge>
                Custom Styling and Layouts
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Different layouts and styling options for various use cases.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Horizontal Layout */}
                <div>
                  <h4 className="font-medium mb-3">Horizontal Layout</h4>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {sampleImages.map((image) => (
                      <div key={image.id} className="flex-shrink-0 w-64">
                        <ImageViewer 
                          image={image} 
                          showDetails={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Large Format */}
                <div>
                  <h4 className="font-medium mb-3">Large Format Display</h4>
                  <div className="max-w-2xl">
                    <ImageViewer 
                      image={sampleImages[0]} 
                      showDetails={true}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Basic Usage</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import ImageViewer from '@/components/ImageViewer';

<ImageViewer 
  image={imageData} 
  showDetails={true}
  className="custom-class"
/>`}
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Image Data Structure</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`interface ImageData {
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
}`}
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Available Routes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/gallery</Badge>
                  <span>Image gallery with grid/list views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/image/:id</Badge>
                  <span>Individual image detail page</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To integrate this into your application:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Replace mock data with actual API calls</li>
                <li>Implement image upload functionality</li>
                <li>Add user permissions and access control</li>
                <li>Integrate with your backend storage system</li>
                <li>Add image compression and optimization</li>
                <li>Implement search and filtering</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}