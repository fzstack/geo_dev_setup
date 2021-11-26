import React from 'react';
import { render } from 'react-dom';
import App from './App';
import MqttClient from './utilities/mqtt_client';
import { DeviceStore } from '@/store';
import { Provider } from 'mobx-react';
import { SnackbarProvider } from 'notistack';

const client = new MqttClient();
const deviceStore = new DeviceStore(client);
(async () => {
  await client.connect();
})();

(window as any).deviceStore = deviceStore;

render(
  <Provider {...{deviceStore}}>
    <SnackbarProvider maxSnack={4}>
      <App />
    </SnackbarProvider>
  </Provider>,
  document.getElementById('root')
);
