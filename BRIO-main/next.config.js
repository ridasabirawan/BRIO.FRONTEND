/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "seo-heist.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ansubkhan.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "zova.s3.us-east-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    // pdfjs-dist (via @react-pdf-viewer) pulls in an optional native `canvas`
    // dependency that is only used in Node and isn't needed in the browser
    // bundle. Stub it out to avoid "Module not found: Can't resolve 'canvas'".
    config.resolve.alias.canvas = false;
    return config;
  },
};
module.exports = nextConfig;
