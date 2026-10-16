export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
};

export function toPublicUser(row: UserRow): PublicUser {
  const { id, email, display_name: displayName } = row;
  return { id, email, displayName };
}
