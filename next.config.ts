import type { NextConfig } from "next";

// Set by the GitHub Actions workflow, e.g. "/katlyn-s-birthday".
// Leave unset locally so the site runs at http://localhost:3000/.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  // Writes play/index.html etc., so refreshing a page works on GitHub Pages.
  trailingSlash: true,
};

export default nextConfig;
