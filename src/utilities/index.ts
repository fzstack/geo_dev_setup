export function delay(ms: number) {
  return new Promise<void>((res, _) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
