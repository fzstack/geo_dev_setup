import React, { useEffect, useState } from "react";

type ScanManProps = {
  onScan: (value: string) => void,
};

export default function({onScan}: Partial<ScanManProps>) {
  const [_, setCodeBuf] = useState<string>('');
  const [__, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      //TODO: 一秒钟没有输入就清空缓存

      setTimeoutId(timeoutId => {
        if(timeoutId != null) {
          clearTimeout(timeoutId);
        }
        return setTimeout(() => {
          console.log('buf cleaned');
          setCodeBuf('');
          setTimeoutId(tid => {
            clearTimeout(tid!);
            return null;
          })
        }, 100);
      });

      if(e.key.length == 1) {
        setCodeBuf(prevCode => {
          return prevCode + e.key;
        })
      } else if(e.code == 'Enter') {
        setCodeBuf(prevCode => {
          if(prevCode.length == 0) return '';
          let fake = prevCode;
          try {
            let url = new URL(fake);
            fake = url.searchParams.get('sn') ?? fake;
          } catch { }
          onScan?.(fake);
          return '';
        });
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);
  return <></>;
};
