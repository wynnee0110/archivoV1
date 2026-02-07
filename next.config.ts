const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable inside VS Code
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config here...
};

export default withPWA(nextConfig);