import type SP from 'serialport';
const SerialPort: typeof SP = window.require('serialport');

type Events = 'connected' | 'disconnected';

type Callbacks = Pick<{
  'connected': () => void,
  'disconnected': () => void,
}, Events>;

export default class ComService {
  private client: SP | null = null;
  private callbacks: Partial<Callbacks> = {};

  async connect(path: string, baudrate: number) {
    return new Promise<void>((res, rej) => {
      const reconnect = () => {
        this.client = new SerialPort(path, {
          baudRate: baudrate,
        }, err => {
          console.log('com open result:', err);
          if(err != null) {
            rej();
          } else {
            res();
          }
        });

        this.client.on('open', () => {
          this.callbacks['connected']?.();
        });

        this.client.on('close', () => {
          this.callbacks['disconnected']?.();
        });
      }

      if(this.client != null) {
        this.client.close((err) => {
          console.log('close result', err);
          this.client!.destroy();
          reconnect();
        });
      } else {
        reconnect();
      }
    });

  }

  on<T extends keyof Callbacks>(event: T, callback: Callbacks[T]) {
    this.callbacks[event] = callback;
  }
}
