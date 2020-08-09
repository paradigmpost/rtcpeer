export function unexpectedError(namespace: string) {
  const err = new Error(`unexpectedError: ${namespace}`);
  err.name = 'unexpectedError';
  return err;
}
