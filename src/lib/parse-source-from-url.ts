const SOURCE_MAP: [string, string][] = [
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["github.com", "GitHub"],
  ["drive.google.com", "Google Drive"],
  ["docs.google.com", "Google Docs"],
  ["daa.uit.edu.vn", "UIT DAA"],
  ["uit.edu.vn", "UIT"],
  ["facebook.com", "Facebook"],
  ["onedrive.live.com", "OneDrive"],
  ["dropbox.com", "Dropbox"],
];

export function parseSourceFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_MAP.find(([key]) => hostname.includes(key))?.[1] ?? null;
  } catch {
    return null;
  }
}
