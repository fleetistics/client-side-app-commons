export function GetPatchValue<TPatch extends Record<string, unknown>>(
  values: Record<string, unknown>,
  dirtyFields: Record<string, unknown>
): TPatch {
  const patch = {} as TPatch;
  const patchRecord = patch as Record<string, unknown>;
  for (const field of Object.keys(dirtyFields)) {
    patchRecord[field] = values[field];
  }
  return patch;
}
