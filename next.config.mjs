/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  reactStrictMode: false, // Avoid double camera init in dev
  output: isGithubActions ? "export" : undefined,
  basePath: isGithubActions ? "/aetheris-vfx" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
