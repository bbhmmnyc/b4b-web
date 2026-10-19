import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
 
// Only allow http(s) links. Blocks javascript:, data:, etc. in user/admin-supplied URLs.
export function safeExternalUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}
