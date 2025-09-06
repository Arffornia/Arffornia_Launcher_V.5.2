import { getMainWindow, logger } from ".";

export const StepName = Object.freeze({
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  CHECK_JAVA: 'CHECK_JAVA',
  INSTALL_JAVA: 'INSTALL_JAVA',
  CHECK_MODLOADER: 'CHECK_MODLOADER',
  DOWNLOAD_MODLOADER: 'DOWNLOAD_MODLOADER',
  FETCHING_MODS: 'FETCHING_MODS',
  UPDATING_MODS: 'UPDATING_MODS',
  DOWNLOAD_MC: 'DOWNLOAD_MC',
  DOWNLOAD_ASSETS: 'DOWNLOAD_ASSETS',
  LAUNCHING: 'LAUNCHING'
});

const labels = {
  en: {
    IDLE: 'Idle',
    PREPARING: 'Preparing files',
    CHECK_JAVA: 'Checking Java',
    INSTALL_JAVA: 'Installing Java',
    CHECK_MODLOADER: 'Checking NeoForge',
    DOWNLOAD_MODLOADER: 'Downloading NeoForge',
    FETCHING_MODS: 'Fetching Mods Info',
    UPDATING_MODS: 'Updating Mods',
    DOWNLOAD_MC: 'Downloading Minecraft',
    DOWNLOAD_ASSETS: 'Downloading Assets',
    LAUNCHING: 'LAUNCHING'
  },
  fr: {
    IDLE: 'Inactif',
    PREPARING: 'Préparation',
    CHECK_JAVA: 'Vérification de Java',
    INSTALL_JAVA: 'Installation de Java',
    CHECK_MODLOADER: 'Vérification de NeoForge',
    DOWNLOAD_MODLOADER: 'Téléchargement de NeoForge',
    FETCHING_MODS: 'Vérification des mods',
    UPDATING_MODS: 'Mise à jour des mods',
    DOWNLOAD_MC: 'Téléchargement de Minecraft',
    DOWNLOAD_ASSETS: 'Téléchargement des assets',
    LAUNCHING: 'Lancement'
  }
};

const stepsConfig = [
  { name: StepName.IDLE, weight: 0 },
  { name: StepName.PREPARING, weight: 3 },
  { name: StepName.CHECK_JAVA, weight: 3 },
  { name: StepName.INSTALL_JAVA, weight: 24 },
  { name: StepName.CHECK_MODLOADER, weight: 2 },
  { name: StepName.DOWNLOAD_MODLOADER, weight: 6 },
  { name: StepName.FETCHING_MODS, weight: 2 },
  { name: StepName.UPDATING_MODS, weight: 27 },
  { name: StepName.DOWNLOAD_MC, weight: 3 },
  { name: StepName.DOWNLOAD_ASSETS, weight: 27 },
  { name: StepName.LAUNCHING, weight: 3 },
];

function getStepLabel(stepName, lang = 'en') {
  return labels[lang]?.[stepName] ?? stepName;
}

class ProgressManager {
  constructor(steps, emitCallback) {
    this.originalSteps = steps;
    this.steps = steps.map(step => ({ ...step, progress: 0 }));
    this.emitCallback = emitCallback;
    this.lastEmittedPercent = -1;
    this.lastEmittedModName = '';
    this.currentModName = '';
    this.currentModIndex = 0;
    this.totalMods = 0;
  }

  clearModInfo() {
    this.currentModName = '';
    this.currentModIndex = 0;
    this.totalMods = 0;
    this.lastEmittedModName = '';
  }

  updateStep(name, progress) {
    progress = Math.max(0, Math.min(1, progress));

    const index = this.steps.findIndex(s => s.name === name);
    if (index === -1) return;

    const step = this.steps[index];

    if (progress < step.progress && name === this.steps.find((s, i) => i === index)?.name) return;

    for (let i = 0; i < index; i++) {
      if (this.steps[i].progress < 1) {
        this.steps[i].progress = 1;
      }
    }

    step.progress = progress;

    const current = this.getGlobalProgress();
    const currentPercent = Math.floor(current * 100);

    if (currentPercent !== this.lastEmittedPercent || this.currentModName !== this.lastEmittedModName) {
      this.lastEmittedPercent = currentPercent;
      this.lastEmittedModName = this.currentModName;

      const label = getStepLabel(name, 'en');

      this.emitCallback(current, name, label, {
        modName: this.currentModName,
        modIndex: this.currentModIndex,
        totalMods: this.totalMods,
      });
    }
  }

  setCurrentModInfo(name, index, total) {
    this.currentModName = name;
    this.currentModIndex = index;
    this.totalMods = total;
  }

  getGlobalProgress() {
    const totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);
    const current = this.steps.reduce((sum, step) => sum + (step.progress * step.weight), 0);
    return current / totalWeight;
  }

  reset() {
    this.steps = this.originalSteps.map(step => ({ ...step, progress: 0 }));
    this.lastEmittedPercent = -1;
    this.clearModInfo();
    this.updateStep(StepName.IDLE, 0);
  }
}

export const progressManager = new ProgressManager(stepsConfig, (value, stepName, label, extra) => {
  logger.info(`Global Progress [${stepName}] (${extra.modName || ''}): ${value}`);

  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('globalProgress', {
      value,
      stepName,
      label,
      modName: extra.modName,
      modIndex: extra.modIndex,
      totalMods: extra.totalMods,
    });
  }
});

export const handleJavaCallback = {
  onStep(step) {
    progressManager.clearModInfo();
    let progress = 0;
    let stepName = StepName.INSTALL_JAVA;

    switch (step) {
      case 'FETCHING': progress = 0.0; break;
      case 'DOWNLOADING': progress = 0.1; break;
      case 'EXTRACTING': progress = 0.5; break;
      case 'CLEANING': progress = 0.8; break;
      default: return;
    }

    progressManager.updateStep(stepName, progress);
  }
}

export function handleNexusModLoaderCallback(step) {
  progressManager.clearModInfo();
  let progress = 0;
  let stepName = StepName.DOWNLOAD_MODLOADER;

  switch (step) {
    case 'CHECKING':
      stepName = StepName.CHECK_MODLOADER;
      progress = 0.1;
      break;
    case 'DOWNLOADING':
      progress = 0.5;
      break;
    default: return;
  }

  progressManager.updateStep(stepName, progress);
}

export const handleNexusModsCallback = {
  onStep(step) {
    let stepName;
    let progress = 0;

    switch (step) {
      case 'UPDATING':
        stepName = StepName.UPDATING_MODS;
        progress = 0;
        break;
      default: return;
    }

    progressManager.updateStep(stepName, progress);
  },

  onProgress(downloaded, total, name) {
    progressManager.setCurrentModInfo(name, downloaded, total);
    const percent = total === 0 ? 0 : downloaded / total;
    progressManager.updateStep(StepName.UPDATING_MODS, percent);
  }
};

export function handleMCLCEvent(e) {
  progressManager.clearModInfo();
  let percent = 0;
  let stepName = StepName.DOWNLOAD_MC;

  switch (e.type) {
    case 'classes-maven-custom': percent = 0.1; break;
    case 'classes-custom': percent = 0.3; break;
    case 'classes': percent = 0.6; break;
    case 'assets': {
      stepName = StepName.DOWNLOAD_ASSETS;
      percent = e.total === 0 ? 0 : e.task / e.total;
      break;
    }
  }

  if (percent === 1) {
    progressManager.updateStep(StepName.LAUNCHING, 1);
    setTimeout(() => {
      progressManager.reset();
    }, 5 * 1000);
    return;
  }

  progressManager.updateStep(stepName, percent);
}
