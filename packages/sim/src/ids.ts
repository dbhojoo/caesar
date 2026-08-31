let next = 1;

export function allocId(): number {
  return next++;
}

export function resetIds(start = 1): void {
  next = start;
}
