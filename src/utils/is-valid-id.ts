export function isValidId(id: string) {
  return (
    /^[0-9]+$/.test(id) && BigInt(id) > 0n && BigInt(id) <= 9223372036854775807n
  );
}
