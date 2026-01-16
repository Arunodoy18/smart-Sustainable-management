/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Enable strict mode for better error detection
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // Rewrites proxy API calls to backend - works in development and production
  async rewrites() {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    
    // Only set up rewrites if we have a backend URL configured
    if (!apiUrl) {
      console.warn('[Next.js] No API_URL configured - API rewrites disabled');
      return [];
    }
    
    console.log(`[Next.js] API rewrites enabled: /api/* -> ${apiUrl}/api/*`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
