import { DataDictItem } from '@/store';
import { Verifier } from '.';
import { LFVerifier } from '.';

export default class {
  static create(item: DataDictItem): Verifier {
    const snPrefix = item.sn.slice(0, 2);
    switch(snPrefix) {
      case 'LF':
        return new LFVerifier(item);
      default:
        throw new Error('Not implemented');
    }
  }
}
