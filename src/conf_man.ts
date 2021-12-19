import Store from 'electron-store';

export default new Store({
  schema: {
    dataDictPath: {
      type: 'string'
    },
  },
  watch: true,
});
