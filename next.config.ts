import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old WordPress URLs, so existing links and bookmarks keep working.
  async redirects() {
    return [
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug",
        destination: "/rankings/:slug",
        permanent: true,
      },
      { source: "/bk-bylaws", destination: "/bylaws", permanent: true },
      { source: "/weekly-power-rankings-archive", destination: "/rankings", permanent: true },
      { source: "/page/:n(\\d+)", destination: "/rankings", permanent: true },
      { source: "/feed", destination: "/feed.xml", permanent: true },
    ];
  },
};

export default nextConfig;
