import path from 'path';

export function delay(ms: number) {
  return new Promise<void>((res, _) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}

type Decos = {
  __enterred: boolean,
}

export function avoidReenter<T, Args>(f: (...args: Args[]) => Promise<T>) {
  const a = f as any as Decos;
  a.__enterred = false;
  return async (...args: any) => {
    if(a.__enterred) {
      return;
    }
    a.__enterred = true;
    const res = await f(...args);
    a.__enterred = false;
    return res;
  }
}

export function assets(p: string) {
  return path.join(__dirname, `../assets`, p);
}
