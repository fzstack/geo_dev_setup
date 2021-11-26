import { action, autorun, computed, makeObservable, observable } from 'mobx';
import MqttClient from '@/utilities/mqtt_client'


type Origin = {
  topic: string,
  payload: string,
  id: number,
}

type DeviceEvents = 'auth';

type DeviceCallbacks = Pick<{
  'auth': () => void,
}, DeviceEvents>;

type DeviceConstProps = {
  gateway: string,
} & ({
  id: string,
} | {
  sn: string,
});

export enum DeviceType {
  WG = 10,
  YL = 11,
  LF = 12,
  QJ = 13,
}

export class Device {
  readonly id: string;
  readonly gateway: string;
  name?: string;
  value?: object;
  authState: boolean = false;
  authTime?: Date;
  private callbacks: Partial<DeviceCallbacks> = {};

  constructor(private outter: DeviceStore, props: DeviceConstProps) {
    makeObservable(this, {
      gateway: observable,
      id: observable,
      sn: computed,
      type: computed,
      name: observable,
      value: observable,
      authState: observable,
      authTime: observable,
      auth: action,
    });

    if('id' in props) {
      this.id = props.id;
    } else if('sn' in props) {
      this.id = Device.snToDid(props.sn);
    } else {
      throw new Error('id prop incorrect');
    }
    this.gateway = props.gateway;
  }

  get sn(): string {
    return Device.didToSn(this.id);
  }

  get type(): DeviceType {
    return parseInt(this.id.slice(0, 2));
  }

  async auth() {
    if(this.authState) return;
    await this.outter.client.pub(this.gateway, `$cmd=set_did_key&device_sn=${this.sn}&did=${this.id}&key=${this.id.padStart(36, '0')}`)
    this.authState = true;
    this.authTime = new Date();
    this.callbacks['auth']?.();
  }

  async reset() {
    await this.pub(`$cmd=autoinitialvalue&device_sn=${this.sn}`);
  }

  async sample() {
    await this.pub(`$cmd=sample&device_sn=${this.sn}`);
  }

  async factory() {
    await this.pub(`$cmd=FactoryStatus&device_sn=${this.sn}`);
  }

  async setUploadDuration(dur: number) {
    await this.pub(`$cmd=set_state_intv&device_sn=${this.sn}&state_intv=${dur}`);
  }

  async setMoniTime(moniTimes: number[]) {
    await this.pub(`$cmd=test_intv&time0=${moniTimes[0]}&time1=${moniTimes[1]}&time2=${moniTimes[2]}&time3=${moniTimes[3]}&time4=${moniTimes[4]}`);
  }

  on<T extends keyof DeviceCallbacks>(event: T, callback: DeviceCallbacks[T]) {
    this.callbacks[event] = callback;
  }

  private async pub(msg: string) {
    await this.outter.client.pub(this.gateway, msg);
  }

  private static didToSn(did: string): string {
    return `${DeviceType[parseInt(did.substr(0, 2))]}0121000000${did.substr(-4)}`;
  }

  private static snToDid(sn: string): string {
    return String(DeviceType[sn.slice(0, 2) as keyof typeof DeviceType]).padStart(2) + sn.slice(-4);
  }
}

export class DeviceStore {
  devices: Device[] = [];
  origins: Origin[] = [];
  autoAuth: boolean = true;
  online: boolean = false;

  constructor(public client: MqttClient) {
    makeObservable(this, {
      devices: observable,
      origins: observable,
      autoAuth: observable,
      online: observable,
      setAutoAuth: action,
      addDevice: action,
    });

    this.client.on('connected', action(() => {
      this.online = true;
    }));

    this.client.on('msg', action(msg => {
      try {
        const from = msg.from();
        const params = msg.params();
        const json = params.get('json');
        let device: Device | undefined;
        if(json != null) {
          const [[id, info]]: [string, Object][] = Object.entries(json);
          const [[name, record]]: [string, Object][] = Object.entries(info);
          const [[timeStr, value]]: [string, object][] = Object.entries(record);

          device = this.devices.find(device => device.id == id);
          if(device == null) {
            device = new Device(this, {
              id,
              gateway: from,
            });
            this.devices.push(device);
          }
          device.name = name;
          device.value = value;
          device.authState = true;
        }

        const cmd = params.get('cmd');

        if(cmd == 'get_did_key') {
          const sn = params.get('device_sn');
          if(sn != null) {
            const tmpDevice = new Device(this, {
              sn,
              gateway: from,
            });
            device = this.devices.find(device => device.id == tmpDevice.id);
            if(device == null) {
              device = tmpDevice;
              this.devices.push(device);
            }
            if(this.autoAuth) {
              // device.auth();
            }
          }
        }
      } catch(e) {

      }
    }));

    this.client.on('origin', action((topic, payload) => {
      this.origins.push({topic, payload: payload.toString('utf8'), id: Math.random()})
      if(this.origins.length > 100) {
        this.origins.shift();
      }
    }));
  }

  addDevice(id: string, gateway: string): Device {
    let device = this.devices.find(device => device.id == id);
    if(device == null) {
      device = new Device(this, {id, gateway});
      this.devices.push(device);
    }
    return device;
  }

  setAutoAuth(value: boolean) {
    this.autoAuth = value;
  }

}

