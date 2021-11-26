import {once} from 'lodash';

export default class {
  private msg?: string;
  constructor(private topic: string, msg: Buffer) {
    this.msg = msg.toString('utf8');
  }

  from = once((): string => {
    let found = this.topic?.match(/^Publish_(.*?$)/);
    if(found == null) throw new Error('unknown gateway');
    return found[1];
  })

  params = once(() => {
    let map = new Map<string, string>();
    let {msg} = this;
    if(msg?.startsWith('$')) {
      [msg] = msg.substr(1).replaceAll('\r', '').split('\n');
      for(const item of msg.split('&')) {
        const [key, value] = item.split('=');
        map.set(key,  value);
      }
    }else if(msg?.startsWith('4')) {
      let found = this.msg?.match(/^\d+(.*?)$/);
      if(found == null) throw new Error('unknown format');
      map.set('json', JSON.parse(found[1]));
    }
    return map;
  })
}
