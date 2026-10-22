/** Fail closed: only a provisioned scheduler secret may trigger privileged writes. */
export function isAuthorizedCalendarSync(request: Request, expectedSecret: string | undefined): boolean {
  if (!expectedSecret) return false;
  const provided = request.headers.get("x-calendar-sync-secret");
  if (!provided || provided.length !== expectedSecret.length) return false;
  let difference = 0;
  for (let index = 0; index < expectedSecret.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expectedSecret.charCodeAt(index);
  }
  return difference === 0;
}