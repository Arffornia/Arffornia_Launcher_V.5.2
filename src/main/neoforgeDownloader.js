import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { logger } from '.';

const NEOFORGE_ENDPOINT = 'https://maven.neoforged.net/releases/net/neoforged/${name}/${version}/${name}-${version}-installer.jar';


export function isBeforeVersion(version, target) {
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
 * @param {string} loadVersion
 * @returns {string} installer URL on the NeoForged Maven
 */
export function getInstallerUrl(loadVersion) {
  const name = isBeforeVersion(loadVersion, "1.20.2") ? "forge" : "neoforge";
  return NEOFORGE_ENDPOINT.replace(/\${version}/g, loadVersion).replace(/\${name}/g, name);
}

/**
 * Parse a Maven `.sha256` file (bare hex digest, optionally followed by a file name).
 * @param {unknown} body
 * @returns {string|null} lower-case hex digest
 */
export function parseSha256File(body) {
  const match = /^\s*([0-9a-fA-F]{64})(\s|$)/.exec(typeof body === 'string' ? body : '');
  return match ? match[1].toLowerCase() : null;
}

/**
 * @param {string} filePath
 * @returns {Promise<string>} lower-case hex sha256 of the file
 */
export async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function fetchExpectedSha256(url) {
  const response = await axios({ url: `${url}.sha256`, method: 'GET', responseType: 'text' });
  const digest = parseSha256File(response.data);
  if (!digest) {
    throw new Error(`Invalid checksum file at ${url}.sha256`);
  }
  return digest;
}

/**
 * Downloads a NeoForge installer file, verified against the checksum published on Maven.
 * The file is written to a temporary `.part` file and only renamed once its hash matches,
 * so an interrupted download is never reused.
 * @param {string} outputPath - The directory to save the installer file.
 * @param {string} loadVersion - The version of NeoForge to download (e.g., '21.1.172').
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
      logger.info(`[NeoForge] Directory created: ${dirPath}`);
    }

    const filename = `forge-${loadVersion}-installer.jar`;
    const filePath = path.join(dirPath, filename);
    const partPath = `${filePath}.part`;
    const url = getInstallerUrl(loadVersion);

    let expected = null;
    try {
      expected = await fetchExpectedSha256(url);
    } catch (err) {
      // Offline: an installer kept from an earlier verified download can still be used.
      if (!forceDownload && fs.existsSync(filePath)) {
        logger.warn(`[NeoForge] Could not fetch the installer checksum (${err.message}), using the existing file`);
        return filePath;
      }
      throw new Error(`Could not fetch the NeoForge installer checksum: ${err.message}`);
    }

    if (!forceDownload && fs.existsSync(filePath)) {
      if ((await sha256File(filePath)) === expected) {
        logger.info(`[NeoForge] Installer already present and verified: ${filePath}`);
        return filePath;
      }
      logger.warn('[NeoForge] Existing installer does not match the published checksum, downloading it again');
      fs.rmSync(filePath, { force: true });
    }

    logger.info(`[NeoForge] Downloading ${url}`);
    progressCallback?.('DOWNLOADING');

    fs.rmSync(partPath, { force: true });
    const response = await axios({ url, method: 'GET', responseType: 'stream' });

    const hash = crypto.createHash('sha256');
    response.data.on('data', (chunk) => hash.update(chunk));
    try {
      await pipeline(response.data, fs.createWriteStream(partPath));
    } catch (err) {
      fs.rmSync(partPath, { force: true });
      throw err;
    }

    const actual = hash.digest('hex');
    if (actual !== expected) {
      fs.rmSync(partPath, { force: true });
      throw new Error(`NeoForge installer checksum mismatch (expected ${expected}, got ${actual})`);
    }

    fs.renameSync(partPath, filePath);
    logger.info(`[NeoForge] Download complete and verified: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`[NeoForge] Error downloading the installer: ${error.message}`);
    throw error;
  }
}
