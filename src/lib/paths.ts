/** Prefixes a file from public/ with the GitHub Pages base path. */
export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
