/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.PUBLIC_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
