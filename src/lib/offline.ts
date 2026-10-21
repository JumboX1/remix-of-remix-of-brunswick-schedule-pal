export interface OfflineContext {
  production: boolean;
  framed: boolean;
  hostname: string;
  search: string;
}

export function canRegisterOffline({ production, framed, hostname, search }: OfflineContext): boolean {
  const previewDomains = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  return production && !framed &&
    !hostname.startsWith("id-preview--") && !hostname.startsWith("preview--") &&
    !previewDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) &&
    new URLSearchParams(search).get("sw") !== "off";
}