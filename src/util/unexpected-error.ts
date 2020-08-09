export function unexpectedError(namespace: string): Error {
  const err = new Error(`unexpectedError: ${namespace}`);
  err.name = 'unexpectedError';
  return err;
}
