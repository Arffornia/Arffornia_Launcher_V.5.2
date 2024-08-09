import { Client } from 'minecraft-launcher-core';
import { Auth } from 'msmc';

export async function launchMC() {
  const launcher = new Client();
  const authManager = new Auth('select_account');
  const xboxManager = await authManager.launch('raw');
  const token = await xboxManager.getMinecraft();

  let opts = {
    clientPackage: null,
    authorization: token.mclc(),
    root: './.minecraft',
    version: {
      number: '1.20.1',
      type: 'release',
    },
    memory: {
      max: '8G',
      min: '3G',
    },
  };

  console.log('Starting!');
  launcher.launch(opts);

  launcher.on('debug', (e) => console.log(e));
  launcher.on('data', (e) => console.log(e));
}
