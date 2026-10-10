export function toPublicUser(row) {
  const { id, email, display_name: displayName } = row;
  return { id, email, displayName };
}
