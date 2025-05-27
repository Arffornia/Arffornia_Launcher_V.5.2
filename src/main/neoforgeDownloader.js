import axios from 'axios';
import fs from 'fs';
import path from 'path';

const NEOFORGE_ENDPOINT = 'https://maven.neoforged.net/releases/net/neoforged/${name}/${version}/${name}-${version}-installer.jar';


function isBeforeVersion(version, target) {
  const v1 = version.split('.').map(Number);
  const v2 = target.split('.').map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 < num2) return true;
    if (num1 > num2) return false;
  }
  return false;
}

/**
 * Downloads a NeoForge installer file.
 * @param {string} outputPath - The directory to save the installer file.
 * @param {string} loadVersion - The version of NeoForge to download (e.g., '1.20.1-47.2.0').
 * @param {boolean} [forceDownload=false] - Whether to force download the file even if it already exists.
 * @param {(step: string) => void} [progressCallback] - Optional callback to report progress steps.
 * @returns {Promise<string>} - Neoforge installer path.
 */
export async function downloadNeoforge(outputPath, loadVersion, forceDownload = false, progressCallback) {
  try {
    progressCallback?.('CHECKING');

    const dirPath = path.resolve(outputPath, 'neoforgeInstaller');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('Directory created:', dirPath);
    }

    const filename = `forge-${loadVersion}-installer.jar`;
    const filePath = path.join(dirPath, filename);

    if (!forceDownload && fs.existsSync(filePath)) {
      console.log('File already exists:', filePath);
      return filePath;
    }

    const name = isBeforeVersion(loadVersion, "1.20.2") ? "forge" : "neoforge";

    const url = NEOFORGE_ENDPOINT.replace(/\${version}/g, loadVersion).replace(/\${name}/g, name);
    console.log('Download URL:', url);

    console.log('Saving file to:', filePath);

    progressCallback?.('DOWNLOADING');

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('File download complete.');
        resolve(filePath);
      });
      writer.on('error', (error) => {
        console.error('Error writing file:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error downloading NeoForge:', error);
    throw error;
  }
}
