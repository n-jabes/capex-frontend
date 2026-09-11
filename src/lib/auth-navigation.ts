/**
 * After login/register, prefer a hard navigation so layouts remount and
 * AuthSessionGate / middleware re-check the session.
 */
export function redirectAfterAuth(nextPath = "/capex-tree") {
  const target = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  window.location.assign(target);
}
