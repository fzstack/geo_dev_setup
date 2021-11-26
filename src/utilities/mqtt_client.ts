import mqtt, { AsyncMqttClient } from 'async-mqtt';
import Msg from './msg'
import conf from '@/confs/mqtt';

type Events = 'msg' | 'origin' | 'connected' | 'disconnected';

type Callbacks = Pick<{
  'msg': (msg: Msg) => void,
  'origin': (topic: string, payload: Buffer) => void,
  'connected': () => void,
  'disconnected': () => void,
}, Events>;

export default class {
  private client?: AsyncMqttClient;
  private callbacks: Partial<Callbacks> = {};

  async connect() {
    this.client = await mqtt.connectAsync(conf.BORKER_URL, {
      username: conf.USERNAME,
      password: conf.PASSWORD,
    });
    this.callbacks['connected']?.();
    await this.client.subscribe('+');
    console.log('mqtt connected');

    this.client.on('message', (topic, payload) => {
      try {
        this.callbacks['origin']?.(topic, payload);
        const msg = new Msg(topic, payload);
        this.callbacks['msg']?.(msg);
        // console.log({
        //   from: msg.from(),
        //   params: msg.params(),
        // });
      } catch(e) {
        console.error({e});
      }
    });
  }

  on<T extends keyof Callbacks>(event: T, callback: Callbacks[T]) {
    this.callbacks[event] = callback;
  }

  async pub(gateway: string, msg: string) {
    await this.client?.publish(`Subscription_${gateway}`, msg);
  }
}
