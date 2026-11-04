export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_updated_at: Date | null;
};

export function toPublicUser(row: UserRow): PublicUser {
  const {
    id,
    email,
    display_name: displayName,
    avatar_updated_at: avatarUpdatedAt,
  } = row;
  const avatarUrl =
    avatarUpdatedAt && `/api/users/${id}/avatar?v=${avatarUpdatedAt.getTime()}`;
  return { id, email, displayName, avatarUrl };
}
