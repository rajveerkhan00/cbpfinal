/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "cbpfinal.vercel.app", 
      "res.cloudinary.com", 
      "images.unsplash.com", 
      "cdn.pixabay.com", 
      "timpackaging.com",
      "localhost:3000" // Add localhost for development
    ],
    unoptimized: true, // Important for proxy images
  },
  
  // Remove rewrites - they might interfere
  async headers() {
    return [
      {
        source: '/api/proxy-image/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/custom-packaging/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Enable experimental features for better image handling
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Compress output
  compress: true,
  
  // Handle trailing slashes
  trailingSlash: false,
};

export default nextConfig;