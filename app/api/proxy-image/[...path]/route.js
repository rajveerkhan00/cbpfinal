import { NextResponse } from 'next/server'

// Cache for image responses
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Clear old cache entries periodically (only on server)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of imageCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        imageCache.delete(key);
      }
    }
  }, 60000);
}

export async function GET(request, { params }) {
  try {
    const { path } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Join the path segments
    const fullPath = Array.isArray(path) ? path.join('/') : path;
    
    // Extract filename
    const pathSegments = fullPath.split('/');
    let filename = pathSegments.pop();
    
    // Extract filename from query parameter if provided
    const filenameFromQuery = searchParams.get('filename') || searchParams.get('id');
    if (filenameFromQuery) {
      filename = filenameFromQuery;
    }
    
    // Check if filename has an extension
    const hasExtension = /\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(filename);
    
    let cloudinaryId;
    let transformation = 'f_auto,q_85'; // Use auto format for better compatibility
    let version = '';
    
    if (hasExtension) {
      // If filename has extension, use it as-is
      cloudinaryId = filename;
    } else {
      // If no extension, the filename is likely the ID
      cloudinaryId = filename;
      
      // Ensure filename has a default extension
      filename = `${filename}.png`;
    }
    
    // Build cache key
    const cacheKey = `${cloudinaryId}_${transformation}_${version}`;
    const cached = imageCache.get(cacheKey);
    
    // Return cached response if available and valid
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`Cache hit for: ${cacheKey}`);
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: cached.headers
      });
    }
    
    // Build Cloudinary URL - FIXED to use proper structure
    let cloudinaryUrl;
    if (version) {
      cloudinaryUrl = `https://res.cloudinary.com/dfnjpfucl/image/upload/${transformation}/${version}/MKF_CPB/products/${cloudinaryId}`;
    } else {
      cloudinaryUrl = `https://res.cloudinary.com/dfnjpfucl/image/upload/${transformation}/MKF_CPB/products/${cloudinaryId}`;
    }
    
    console.log('Fetching from Cloudinary:', cloudinaryUrl);
    
    // Fetch the image
    const response = await fetch(cloudinaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Image-Proxy/1.0)'
      }
    });
    
    if (!response.ok) {
      // Try with different formats
      const formats = ['f_png,q_85', 'f_jpg,q_85', 'f_webp,q_85', 'f_auto,q_85'];
      
      for (const format of formats) {
        const fallbackUrl = `https://res.cloudinary.com/dfnjpfucl/image/upload/${format}/MKF_CPB/products/${cloudinaryId}`;
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (fallbackResponse.ok) {
          const imageBuffer = await fallbackResponse.arrayBuffer();
          const contentType = fallbackResponse.headers.get('content-type') || 'image/png';
          
          // Determine file extension from content type
          let fileExtension = 'png';
          if (contentType.includes('jpeg')) fileExtension = 'jpg';
          if (contentType.includes('webp')) fileExtension = 'webp';
          if (contentType.includes('gif')) fileExtension = 'gif';
          
          const newFilename = `${cloudinaryId}.${fileExtension}`;
          
          // Prepare response headers - CRITICAL FIX
          const headers = {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(newFilename)}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; img-src 'self';",
            'X-Frame-Options': 'DENY',
          };
          
          // Cache the response
          imageCache.set(cacheKey, {
            buffer: imageBuffer,
            headers: headers,
            timestamp: Date.now()
          });
          
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: headers
          });
        }
      }
      
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Determine file extension from content type
    let fileExtension = 'png';
    if (contentType.includes('jpeg')) fileExtension = 'jpg';
    if (contentType.includes('webp')) fileExtension = 'webp';
    if (contentType.includes('gif')) fileExtension = 'gif';
    
    const newFilename = `${cloudinaryId}.${fileExtension}`;
    
    // Prepare response headers - CRITICAL FIX for opening in new tab
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(newFilename)}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self';",
      'X-Frame-Options': 'DENY',
    };
    
    // Cache the response
    imageCache.set(cacheKey, {
      buffer: imageBuffer,
      headers: headers,
      timestamp: Date.now()
    });
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Proxy image error:', error);
    
    // Return a proper error image
    const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0"/>
      <text x="200" y="150" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
        Image not available
      </text>
    </svg>`;
    
    return new NextResponse(placeholderSvg, {
      status: 404,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': 'inline; filename="placeholder.svg"',
      }
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export const dynamic = 'force-dynamic';