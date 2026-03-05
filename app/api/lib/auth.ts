export function getUserFromCookie(): string {
  if (typeof document === "undefined") return "User";
  const m = document.cookie.match(/(?:^|;\s*)user=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "User";
}

export function getInitials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}