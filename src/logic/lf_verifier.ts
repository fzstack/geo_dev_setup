import { Verifier } from '.';
import { SlotVerifyResult } from './verifier';

export default class extends Verifier {
  protected verify(record: any): SlotVerifyResult[] {
    const result: SlotVerifyResult[] = [];
    if('X' in record) {
      result.push({
        slot: 0,
        pass: Math.abs(record.X) < 2,
      });
    }
    if('Y' in record) {
      result.push({
        slot: 1,
        pass: Math.abs(record.Y) < 2,
      });
    }
    return result;
  }
  protected getVerifySlotCount(): number {
    return 2;
  }
};
