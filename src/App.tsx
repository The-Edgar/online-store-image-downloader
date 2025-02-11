import React, { useState, Component, ErrorInfo } from 'react';
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface ImageData {
  url: string;
  alt: string;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <ImageIcon className="w-8 h-8 text-red-600" />
                <h1 className="text-2xl font-semibold text-gray-800">Something went wrong</h1>
              </div>
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                An error occurred while loading the application. Please try refreshing the page.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('App component starting initialization...');

  try {
    console.log('Initializing state...');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ImageData[]>([]);
    const [progress, setProgress] = useState<string | null>(null);
    console.log('State initialized successfully');

    console.log('Starting component render...');
    const isValidUrl = (urlString: string) => {
      try {
        new URL(urlString);
        return true;
      } catch {
        return false;
      }
    };

    const isProductPage = (html: string): boolean => {
      const lowerHtml = html.toLowerCase();
      const productIndicators = [
        'product',
        'item',
        'shop',
        'price',
        'buy now',
        'add to cart',
        '€',
        '£',
        'size',
        'color'
      ];
      
      return productIndicators.some(indicator => lowerHtml.includes(indicator));
    };

    const extractImages = (html: string): ImageData[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images: ImageData[] = [];

      // Extract regular img tags
      doc.querySelectorAll('img').forEach((img) => {
        const src = img.src;
        const alt = img.alt;
        if (src && !src.includes('logo') && !src.includes('icon')) {
          images.push({ url: src, alt: alt || 'Product image' });
        }
      });

      // Extract picture elements
      doc.querySelectorAll('picture source').forEach((source) => {
        const srcset = (source as HTMLSourceElement).srcset;
        if (srcset) {
          const firstSrc = srcset.split(',')[0].split(' ')[0];
          images.push({ url: firstSrc, alt: 'Product image' });
        }
      });

      return images;
    };

    const downloadImages = async () => {
      const zip = new JSZip();
      const folder = zip.folder('product_images');
      
      if (!folder) return;

      for (let i = 0; i < images.length; i++) {
        try {
          const response = await fetch(images[i].url);
          const blob = await response.blob();
          const extension = images[i].url.split('.').pop() || 'jpg';
          folder.file(`image_${i + 1}.${extension}`, blob);
        } catch (error) {
          console.error('Error downloading image:', error);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'product_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setImages([]);
      setProgress(null);

      if (!isValidUrl(url)) {
        setError('Invalid URL format');
        return;
      }

      setIsLoading(true);

      try {
        // Note: In a production environment, you would need a proxy server to handle CORS
        const response = await fetch(url);
        const html = await response.text();

        if (!isProductPage(html)) {
          setError("This doesn't appear to be a product page from a supported store.");
          setIsLoading(false);
          return;
        }

        const extractedImages = extractImages(html);
        
        if (extractedImages.length === 0) {
          setError('No images found for this product.');
          setIsLoading(false);
          return;
        }

        setImages(extractedImages);
        setProgress(`Found ${extractedImages.length} images`);
      } catch (error) {
        setError('Could not reach the website. Please check the URL and your internet connection.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <ImageIcon className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-semibold text-gray-800">Product Image Fetcher</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter shopify product page URL"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Fetch Images'
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {progress && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
                  {progress}
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={downloadImages}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download All as ZIP
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Note: Due to browser security restrictions (CORS), this tool may not work with all websites.
              For development/testing, you may need to disable CORS restrictions in your browser.
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-8">
              <ImageIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Product Image Fetcher</h1>
            </div>

            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error || 'An error occurred. Please try again later.'}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Note: Due to browser security restrictions (CORS), this tool may not work with all websites.
            For development/testing, you may need to disable CORS restrictions in your browser.
          </div>
        </div>
      </div>
    );
  }
}

export default App;