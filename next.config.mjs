/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable React strict mode to prevent double renders
    reactStrictMode: false,
    
    // Handle socket.io-client dependencies
    webpack: (config) => {
      // Prevent issues with socket.io polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        "supports-color": false,
      };
      
      return config;
    }
  };
  
  // Use ESM export syntax for .mjs files
  export default nextConfig;