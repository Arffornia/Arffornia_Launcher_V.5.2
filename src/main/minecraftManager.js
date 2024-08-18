import { Client } from 'minecraft-launcher-core';
import { Auth } from 'msmc';
import { downloadNeoforge } from './neoforgeDownloader';
import path from 'path';
import { NexusMods } from '@the_gost_sniper/nexus_mods'

export async function launchMC() {
  const launcher = new Client();
  const authManager = new Auth('select_account');
  const xboxManager = await authManager.launch('raw');
  const token = await xboxManager.getMinecraft();

  const gameDir = './.Arffornia_V.5.2';
  const neoforgeVersion = '1.20.1-47.1.84';

  const neoforgeInstallerPath = await downloadNeoforge(
    gameDir,
    neoforgeVersion,
    false
  );

  console.log('NeoForge installer path:', neoforgeInstallerPath);

  let opts = {
    clientPackage: null,
    authorization: token.mclc(),
    root: gameDir,
    version: {
      number: '1.20.1',
      type: 'release',
    },
    forge: neoforgeInstallerPath,
    memory: {
      max: '8G',
      min: '3G',
    },
    overrides: {
      detached: false,
    }
  };

  const modDir = path.join(gameDir, "mods");
  const nexusMods = new NexusMods(modDir);

  const jsonModListUrl = "https://arffornia.ddns.net/files/NexusModList.json";
  await nexusMods.loadModsFromJsonUrl(jsonModListUrl);

  await nexusMods.updateMods(true, true);

  console.log('Starting Minecraft with options:', opts);
  launcher.launch(opts);

  launcher.on('debug', (e) => console.log(e));
  launcher.on('data', (e) => console.log(e));
}
