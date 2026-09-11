/**
 * After login/register the Nest Set-Cookie must be visible to Next middleware.
 * Soft client navigations can race; prefer a hard navigation once the marker exists.
 */
export function redirectAfterAuth(nextPath = "/capex-tree") {
  const target = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  if (typeof document !== "undefined") {
    const hasMarker = document.cookie
      .split(";")
      .some((part) => part.trim().startsWith("capex_auth="));
    if (hasMarker) {
      window.location.assign(target);
      return;
    }
  }
  // Cookie may still be committing; hard nav still lets middleware re-read cookies.
  window.location.assign(target);
}
