import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The five main destinations are Home, Explore, Neighborhoods, City and Profile.
  // Existing pages keep their URLs; these are friendly aliases for the new names.
  async redirects() {
    return [
      { source: "/explore", destination: "/discover", permanent: false },
      { source: "/me", destination: "/profile", permanent: false },
      { source: "/help", destination: "/bridge", permanent: false },
    ];
  },
};

export default nextConfig;
