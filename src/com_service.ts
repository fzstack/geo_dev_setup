import type SP from 'serialport';
const SerialPort: typeof SP = window.require('serialport');
import EventEmitter from 'eventemitter3';
import { fromPairs } from 'lodash';

type Events = 'connected' | 'disconnected';

type Callbacks = Pick<{
  'connected': (path: string) => void,
  'disconnected': () => void,
}, Events>;

type GeoCommand = 'set_device_sn' | 'set_id_apikey';

type GeoArgs = Pick<{
  set_device_sn: {
    device_sn: string,
  },
  set_id_apikey: {
    id: string,
    apikey: string,
  }
}, GeoCommand>;

export type GeoFrame = {
  type: 'cmdResp' | 'prop',
  data: any,
};

export default class ComService {
  public client: SP | null = null;
  private callbacks: Partial<Callbacks> = {};
  private buf = Buffer.from('');
  private event = new EventEmitter<'recv'>();

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
          this.callbacks['connected']?.(path);
        });

        this.client.on('close', () => {
          this.callbacks['disconnected']?.();
        });

        this.client.on('data', (e: Buffer) => {
          this.buf = Buffer.concat([this.buf, e]);
          console.debug('com recv', {e, s: e.toString()});
          this.event.emit('recv');
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

  async disconnect() {
    this.client?.close((err) => {
      this.client!.destroy();
      this.client = null;
    });
  }

  async configUplink(cmds: string[]) {
    console.debug({cmds});
    await this.atCommand('+++', '');
    for(const cmd of cmds) {
      await this.atCommand(cmd);
    }
    await this.atCommand('ATT');
  }

  clearBuffer() {
    this.buf = Buffer.from('');
  }

  async geoCommand<T extends keyof GeoArgs>(cmd: T, args: GeoArgs[T]) {
    const sb: string[] = [`$cmd=${cmd}`];
    for(const k in args) {
      sb.push(`&${k}=${args[k]}`);
    }
    sb.push('\r\n');
    let resp: any;
    do {
      await this.write(sb.join(''));
      do {
        resp = await this.waitGeoResponse();
      } while(resp.cmd != cmd);
    } while(resp.result != 'succ');
  }

  async atCommand(cmd: string, suffix: string = '\r\n') {
    //TODO: 等待返回OK或者ERxx
    this.clearBuffer();
    await this.write(`${cmd}${suffix}`);
    console.debug('wait for at resp');
    const atResp = await this.waitAtResponse();
    console.debug({atResp});
    return atResp;
  }

  async write(data: any) {
    console.debug('com send', data);
    return new Promise<number>((res, rej) => {
      if(this.client == null) {
        rej('null');
      } else {
        this.client.write(data, (err, written) => {
          if(err) {
            rej(err);
          } else {
            res(written);
          }
        });
      }
    })
  }

  async waitDev() {
    let line: string;
    do {
      line = (await this.readLine()).toString();
    } while(line != 'Request set parameters')
  }

  async waitGeoResponse() {
    let dat: string;
    while(true) {
      dat = (await this.readLine()).toString();
      const kvp = this.parseGeoResponse(dat);
      if(kvp == null) continue;
      return kvp;
    }
  }

  //if failed return null
  parseGeoResponse(line: string): any | null {
    if(line[0] != '$') return null;
    line = line.slice(1);
    const kvp = fromPairs(line.split('&').map(e => e.split('=')));
    return kvp;
  }

  async waitAtResponse() {
    const res: string[] = [];
    let line: Buffer;
    do {
      line = await this.readLine();
      res.push(line.toString());
    } while(!(line.indexOf('OK') == 0 || line.indexOf('ER') == 0))
    return res;
  }

  async readGeoFrame(timeout?: number) {
    return new Promise<GeoFrame>((res, rej) => {
      let tid: NodeJS.Timeout | null = null;

      const cb = () => {

        const geoCmdPrefixIdx = this.buf.indexOf('$');
        const devPropIdx = this.buf.indexOf('\x02');
        const minIdexPrefixIdx = Math.min(...[geoCmdPrefixIdx, devPropIdx].filter(e => e != -1));

        if(minIdexPrefixIdx == Infinity) return false;

        this.buf = this.buf.slice(minIdexPrefixIdx);

        let frame: GeoFrame;

        if(this.buf[0] == '$'.charCodeAt(0)) {
          let idx = this.buf.indexOf('\r\n');
          if(idx == -1) return false;
          const dat = this.buf.slice(0, idx).toString();
          this.buf = this.buf.slice(idx + 2, this.buf.length);
          frame = {
            type: 'cmdResp',
            data: this.parseGeoResponse(dat),
          }
        } else if(this.buf[0] == '\x02'.charCodeAt(0)) {
          if(this.buf.length < 3) return false;
          const lenField = this.buf.readInt16BE(1);
          if(this.buf.length < 3 + lenField) return false;
          const dat = this.buf.slice(3, lenField + 3).toString();
          this.buf = this.buf.slice(lenField + 3, this.buf.length);
          frame = {
            type: 'prop',
            data: JSON.parse(dat),
          }
        } else {
          return false;
        }
        this.event.removeListener('recv', cb);
        if(tid != null) {
          clearTimeout(tid);
        }
        console.debug('geoFrame cb invoked', {frame});
        res(frame);
        return true;
      };
      if(cb()) return;
      if(timeout != undefined) {
        tid = setTimeout(() => {
          this.event.removeListener('recv', cb);
          rej(new Error('timeout'));
        }, timeout);
      }
      this.event.on('recv', cb);
    });
  }

  async readLine(timeout?: number) {
    return new Promise<Buffer>((res, rej) => {
      let tid: NodeJS.Timeout | null = null;

      const cb = () => {
        let idx = this.buf.indexOf('\r\n');
        if(idx == -1) return false;
        const dat = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 2, this.buf.length)
        this.event.removeListener('recv', cb);
        if(tid != null) {
          clearTimeout(tid);
        }
        console.debug('readLine cb invoked', {dat});
        res(dat);
        return true;
      };
      if(cb()) return;
      if(timeout != undefined) {
        tid = setTimeout(() => {
          this.event.removeListener('recv', cb);
          rej(new Error('timeout'));
        }, timeout);
      }
      this.event.on('recv', cb);
    });
  }

  on<T extends keyof Callbacks>(event: T, callback: Callbacks[T]) {
    this.callbacks[event] = callback;
  }
}
