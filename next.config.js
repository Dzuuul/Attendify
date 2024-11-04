const { node } = require("prop-types");

/** @type {import('next').NextConfig} */
module.exports = {
  // reactStrictMode: true,
  env: {
    CRYPTO_SECRET: process.env.CRYPTO_SECRET,
  },
  node: {
    net: "empty",
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  output: "export",
};
