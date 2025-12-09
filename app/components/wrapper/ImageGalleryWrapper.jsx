"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export const ImageGalleryWrapper = ({ 
  images = [], 
  image = {}, 
  category = "", 
  slug = "",
  imageProxyUrls = [],
  galleryProxyUrls = []
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [processedImages, setProcessedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processImages = async () => {
      setIsLoading(true);
      const allImages = [];
      const baseUrl = window.location.origin;
      
      // Use direct proxy URLs if provided
      if (imageProxyUrls.length > 0 || galleryProxyUrls.length > 0) {
        // Add main images
        imageProxyUrls.forEach((url, index) => {
          if (url) {
            allImages.push({
              url: url,
              proxyUrl: url,
              alt: `Main product image ${index + 1}`,
              friendlyName: `main${index > 0 ? `-${index + 1}` : ''}`,
              isProxy: true
            });
          }
        });
        
        // Add gallery images
        galleryProxyUrls.forEach((url, index) => {
          if (url) {
            allImages.push({
              url: url,
              proxyUrl: url,
              alt: `Gallery image ${index + 1}`,
              friendlyName: `image${index + 1}`,
              isProxy: true
            });
          }
        });
      } else {
        // Process main image
        if (image?.url) {
          const cloudinaryId = extractCloudinaryId(image.url);
          if (cloudinaryId) {
            allImages.push({
              url: image.url,
              proxyUrl: `${baseUrl}/api/proxy-image/${cloudinaryId}`,
              alt: image.alt || 'Main product image',
              friendlyName: 'main',
              isProxy: true,
              directUrl: image.url
            });
          } else if (image.url.startsWith('http')) {
            // Use direct URL if it's already a full URL
            allImages.push({
              url: image.url,
              proxyUrl: image.url,
              alt: image.alt || 'Main product image',
              friendlyName: 'main',
              isProxy: false
            });
          }
        }
        
        // Process gallery images
        if (Array.isArray(images)) {
          images.forEach((img, index) => {
            if (img?.url) {
              const cloudinaryId = extractCloudinaryId(img.url);
              if (cloudinaryId) {
                allImages.push({
                  url: img.url,
                  proxyUrl: `${baseUrl}/api/proxy-image/${cloudinaryId}`,
                  alt: img.alt || `Gallery image ${index + 1}`,
                  friendlyName: `image${index + 1}`,
                  isProxy: true,
                  directUrl: img.url
                });
              } else if (img.url.startsWith('http')) {
                allImages.push({
                  url: img.url,
                  proxyUrl: img.url,
                  alt: img.alt || `Gallery image ${index + 1}`,
                  friendlyName: `image${index + 1}`,
                  isProxy: false
                });
              }
            }
          });
        }
      }
      
      setProcessedImages(allImages);
      setIsLoading(false);
    };
    
    processImages();
  }, [images, image, category, slug, imageProxyUrls, galleryProxyUrls]);

  // Helper function to extract Cloudinary ID
  const extractCloudinaryId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Try different patterns
    const patterns = [
      /MKF_CPB\/products\/([^\/.]+)/,
      /\/upload\/.*\/(MKF_CPB\/products\/[^\/.]+)/,
      /image\/upload\/.*\/(v[^\/]+\/)?(MKF_CPB\/products\/[^\/.]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const fullPath = match[match.length - 1];
        const segments = fullPath.split('/');
        const filename = segments[segments.length - 1];
        return filename.split('.')[0];
      }
    }
    
    return null;
  };

  // Fill up to 4 slots for consistent layout
  const imageSlots = [];
  for (let i = 0; i < 4; i++) {
    if (processedImages[i]) {
      imageSlots.push(processedImages[i]);
    } else {
      imageSlots.push({ 
        isPlaceholder: true, 
        index: i,
        alt: `Image placeholder ${i + 1}`
      });
    }
  }

  // Function to handle image click in new tab - FIXED
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl && !imageUrl.includes('placeholder')) {
      // For proxy URLs, they should open directly in browser
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to copy image URL to clipboard
  const copyImageUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert('Image URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Large Image */}
      <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
        {imageSlots[selectedImageIndex].isPlaceholder ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Image {selectedImageIndex + 1}</span>
          </div>
        ) : (
          <>
            <Image
              src={imageSlots[selectedImageIndex].proxyUrl || imageSlots[selectedImageIndex].url || ''}
              alt={imageSlots[selectedImageIndex].alt || `Product image ${selectedImageIndex + 1}`}
              fill
              className="object-contain cursor-pointer"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedImageIndex === 0}
              unoptimized={true}
              onClick={() => openImageInNewTab(imageSlots[selectedImageIndex].proxyUrl || imageSlots[selectedImageIndex].url)}
            />
            
            {/* Overlay with open in new tab button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openImageInNewTab(imageSlots[selectedImageIndex].proxyUrl || imageSlots[selectedImageIndex].url);
                }}
                className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="text-sm font-medium">Open in New Tab</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-2">
        {imageSlots.map((img, index) => (
          <div key={index} className="relative group">
            <button
              className={`w-full aspect-square relative rounded-md overflow-hidden border-2 transition-all ${
                selectedImageIndex === index 
                  ? "border-red-500 ring-2 ring-red-500" 
                  : "border-gray-300 hover:border-gray-400"
              } ${img.isPlaceholder ? 'bg-gray-100' : 'bg-white'}`}
              onClick={() => setSelectedImageIndex(index)}
              type="button"
              title={img.isPlaceholder ? `Image ${index + 1}` : `Click to view ${img.alt}`}
            >
              {img.isPlaceholder ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs mt-1">{index + 1}</span>
                </div>
              ) : (
                <Image
                  src={img.proxyUrl || img.url}
                  alt={img.alt || `Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 12.5vw"
                  unoptimized={true}
                />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};