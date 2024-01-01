import './src/env.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: '*.googleusercontent.com',
  //       port: '',
  //       pathname: '/*/**',
  //     },
  //   ],
  // },
}

export default nextConfig
