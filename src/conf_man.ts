import Store from 'electron-store';

export default new Store({
  schema: {
    dataDictPath: {
      type: 'string'
    },
    initSeqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          seq: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                cmd: {type: 'string'},
                desc: {type: 'string'},
              },
            },
          },
        },
      },
    },
    selectedInitSeqName: {
      type: 'string',
    }
  },
  watch: true,
  defaults: {
    dataDictPath: null,
    selectedInitSeqName: 'f5',
    initSeqs: [
      {
        "name": "f5",
        "seq": [
          {
            "cmd": "AT+TFREQ=1C390960",
            "desc": "设置发送频率为473.5Hz"
          },
          {
            "cmd": "AT+RFREQ=1E120f20",
            "desc": "设置接收频率为504.5Hz"
          }
        ]
      }
    ],
  },
});
