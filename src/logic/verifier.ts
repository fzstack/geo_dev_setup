import { GeoFrame } from '@/com_service';
import { DataDictItem } from '@/store';

export enum SlotStatus {
  Unknown,
  Failed,
  Success,
};

export type SlotVerifyResult = {
  slot: number;
  pass: boolean;
};

export default abstract class {
  slotStatus: SlotStatus[];

  constructor(private item: DataDictItem) {
    this.slotStatus = Array(this.getVerifySlotCount()).fill(SlotStatus.Unknown);
  }

  public processFrame(frame: GeoFrame) {
    if(frame.type == 'prop') {
      for(const id in frame.data) {
        if(id == this.item.did) {
          const devs = frame.data[id];
          for(const seq of devs.keys()) {
            for(const record of seq.keys()) {
              for(const result of this.verify(record)) {
                if(this.slotStatus[result.slot] == SlotStatus.Failed) continue;
                this.slotStatus[result.slot] = result.pass ? SlotStatus.Success : SlotStatus.Failed;
              }
            }
          }
        }
      }
    }
  }

  public getResult(): SlotStatus {
    if(this.slotStatus.every(s => s == SlotStatus.Success))
      return SlotStatus.Success;
    if(this.slotStatus.some(s => s == SlotStatus.Failed))
      return SlotStatus.Failed;
    return SlotStatus.Unknown;
  }

  //可以同时返回多项测试的结果
  protected abstract verify(record: any): SlotVerifyResult[];
  protected abstract getVerifySlotCount(): number;
}
