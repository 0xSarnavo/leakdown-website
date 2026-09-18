/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // dev would otherwise write AGENTS.md/CLAUDE.md into the repo on every start
  agentRules: false,
  async headers() {
    // Nothing here has a hash in its name, so nothing is cached blind: short TTL,
    // then serve stale while revalidating. Bump max-age if assets ever get hashed names.
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "cache-control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    // the docs moved to their own site (leakdown-docs)
    return [
      { source: "/docs", destination: "https://docs.leakdown.dev/introduction", permanent: false },
      { source: "/docs/:path*", destination: "https://docs.leakdown.dev/:path*", permanent: false },
    ];
  },
  async rewrites() {
    // legacy paths stay alive for the public/app.js probe + form (03-01-PARITY.md §5)
    return [
      { source: "/request", destination: "/api/request" },
      { source: "/orders", destination: "/api/orders" },
      { source: "/orders/:path*", destination: "/api/orders/:path*" },
    ];
  },
};

export default nextConfig;
