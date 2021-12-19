import { action, autorun, computed, makeObservable, observable } from 'mobx';
import MqttClient from '@/utilities/mqtt_client'
import XLSX from 'xlsx';
import confMan from '@/conf_man';
import ComService from '@/com_service';

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
    // await this.outter.client.pub(this.gateway, `$cmd=set_did_key&device_sn=${this.sn}&did=${this.id}&key=${this.id.padStart(36, '0')}`)
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
    // await this.outter.client.pub(this.gateway, msg);
  }

  private static didToSn(did: string): string {
    return `${DeviceType[parseInt(did.substr(0, 2))]}0121000000${did.substr(-4)}`;
  }

  private static snToDid(sn: string): string {
    return String(DeviceType[sn.slice(0, 2) as keyof typeof DeviceType]).padStart(2) + sn.slice(-4);
  }
}

type SeqItem = {
  cmd: string;
  desc: string;
}

type InitSeqConfigItemProps = {
  name: string,
  seq: SeqItem[],
}

export class InitSeqConfigItem {
  name: string;
  seq: SeqItem[];

  constructor(private outter: DeviceStore, props: InitSeqConfigItemProps) {
    makeObservable(this, {
      name: observable,
      select: action,
      index: computed,
    });
    this.name = props.name;
    this.seq = props.seq;
  }

  select() {
    this.outter.selectItem(this);
  }

  get index(): number {
    return this.outter.indexOfItem(this);
  }
}

export class DataDictItem {
  constructor(public sn: string, public did: string, public key: string) {

  }
}


export class DeviceStore {
  devices: Device[] = [];
  origins: Origin[] = [];
  autoAuth: boolean = true;
  online: boolean = false;
  initSeqConfigItems: InitSeqConfigItem[];
  currentSelectedItem: InitSeqConfigItem | null = null;
  dataDictItems: DataDictItem[] = [];
  currentSelectedDevice: DataDictItem | null = null;

  constructor(private comService: ComService) {
    makeObservable(this, {
      devices: observable,
      origins: observable,
      autoAuth: observable,
      online: observable,
      initSeqConfigItems: observable,
      currentSelectedItem: observable,
      dataDictItems: observable,
      currentSelectedDevice: observable,
      currentItem: computed,
      setAutoAuth: action,
      addDevice: action,
      selectItem: action,
      loadDataDict: action,
      selectCurrentDevice: action,
      setOnline: action,
    });

    comService.on('connected', () => {
      this.setOnline(true);
    });

    comService.on('disconnected', () => {
      this.setOnline(false);
    });


    const dataDictPath = confMan.get('dataDictPath');
    if(dataDictPath != null) {
      this.loadDataDict(dataDictPath as string);
    }
    confMan.onDidChange('dataDictPath', val => {
      this.loadDataDict(val as string);
    });

    this.initSeqConfigItems = [
      new InitSeqConfigItem(this, {
        name: 'TEST',
        seq: [
          {
            cmd: "AT+TFREQ=FFF",
            desc: "设置发送频率",
          },
          {
            cmd: "AT+RFREQ=FFF",
            desc: "设置接收频率",
          }
        ],
      }),
      new InitSeqConfigItem(this, {
        name: '网关',
        seq: [
          {
            cmd: "AT+HELLO",
            desc: "你好",
          },
        ],
      }),
      new InitSeqConfigItem(this, {
        name: '子设备',
        seq: [
          {
            cmd: "AT+TEST",
            desc: "测试",
          },
          {
            cmd: "AT+CHN=5",
            desc: "设置频段",
          },
          {
            cmd: "AT+BALABALA",
            desc: "其他的",
          }
        ],
      }),
    ];

    this.currentSelectedItem = this.initSeqConfigItems[0];

  }

  get currentItem() {
    return this.currentSelectedItem;
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

  selectItem(item: InitSeqConfigItem | null) {
    this.currentSelectedItem = item;
  }

  indexOfItem(item:InitSeqConfigItem) {
    return this.initSeqConfigItems.indexOf(item);
  }

  loadDataDict(path: string) {
    const t = XLSX.readFile(path);
    // confMan.set('dataDictPath', path);
    this.dataDictItems.splice(0);
    for(const sheetName of t.SheetNames) {
      const sheet = t.Sheets[sheetName];
      const ref = sheet['!ref'];
      const rend = +ref!.match(/^\w+:\D+?(\d+)$/i)![1];
        for(let i = 2; i <= rend; i++) {
          this.dataDictItems.push(new DataDictItem(sheet[`A${i}`].v, sheet[`B${i}`].v, sheet[`C${i}`].v))
        }
    }
  }

  selectCurrentDevice(sn: string) {
    this.currentSelectedDevice = this.dataDictItems.filter(e => e.sn == sn)?.[0] ?? null;
    console.log('current', this.currentSelectedDevice)
  }

  setOnline(ol: boolean) {
    this.online = ol;
  }

}


// export class ConfigStore {
//   initSeqConfigItems: InitSeqConfigItem[];
//   test: string;

//   constructor() {
//     makeObservable(this, {
//       initSeqConfigItems: observable,
//       test: observable,
//       deselectInitSeqConfigItemWithout: action,
//       testWhat: action,
//     });
//     this.test = '233';
//     this.initSeqConfigItems = [
//       new InitSeqConfigItem(this, {
//         name: 'TEST',
//         seq: [
//           'HELLO',
//         ],
//       }),
//       new InitSeqConfigItem(this, {
//         name: '网关',
//         seq: [
//           'ABCD',
//         ],
//       }),
//       new InitSeqConfigItem(this, {
//         name: '子设备',
//         seq: [
//           'ABCD',
//         ],
//       }),
//     ];
//   }

//   testWhat(value: string) {
//     this.test = value
//   }

//   deselectInitSeqConfigItemWithout(item: InitSeqConfigItem) {
//     this.initSeqConfigItems.filter(x => x != item).forEach(x => x.deselect());
//   }

// }
