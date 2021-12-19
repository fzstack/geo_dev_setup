import React from 'react';
import { render } from 'react-dom';
import App from './App';
import MqttClient from './utilities/mqtt_client';
import { DeviceStore } from '@/store';
import { Provider } from 'mobx-react';
import { SnackbarProvider } from 'notistack';
import ComService from '@/com_service';

// const client = new MqttClient();
const comService = new ComService();
const deviceStore = new DeviceStore(comService);

(window as any).deviceStore = deviceStore;

render(
  <Provider {...{deviceStore, comService}}>
    <SnackbarProvider maxSnack={4}>
      <App />
    </SnackbarProvider>
  </Provider>,
  document.getElementById('root')
);
