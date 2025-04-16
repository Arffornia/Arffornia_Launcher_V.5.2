import { getMainWindow, logger } from ".";

export const StepName = Object.freeze({
  // Launcher
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',

  // Nexus Java
  CHECK_JAVA: 'CHECK_JAVA',
  INSTALL_JAVA: 'INSTALL_JAVA',

  // Nexus ModLoader (coming soon)
  CHECK_MODLOADER: 'CHECK_MODLOADER',
  DOWNLOAD_MODLOADER: 'DOWNLOAD_MODLOADER',

  // Nexus Mods
  FETCHING_MODS: 'FETCHING',
  UPDATING_MODS: 'UPDATING',

  // MCLC
  DOWNLOAD_MC: 'DOWNLOAD_MC',
  DOWNLOAD_ASSETS: 'DOWNLOAD_ASSETS',

  LAUNCHING: 'LAUNCHING'
});

const labels = {
  en: {
    // Launcher
    IDLE: 'Idle',
    PREPARING: 'Preparing files',

    // Nexus Java
    CHECK_JAVA: 'Checking Java',
    INSTALL_JAVA: 'Installing Java',

    // Nexus ModLoader (coming soon)
    CHECK_MODLOADER: 'Checking NeoForge',
    DOWNLOAD_MODLOADER: 'Downloading NeoForge',

    // Nexus Mods
    FETCHING_MODS: 'Checking Mods',
    UPDATING_MODS: 'Downloading Mods',

    // MCLC
    DOWNLOAD_MC: 'Downloading Minecraft',
    DOWNLOAD_ASSETS: 'Downloading Assets',

    // Game
    LAUNCHING: 'LAUNCHING'
  },
};

const stepsConfig = [
  // Launcher
  { name: StepName.IDLE, weight: 0 }, // 0
  { name: StepName.PREPARING, weight: 3 }, // 3

  // Nexus Java
  { name: StepName.CHECK_JAVA, weight: 3 }, // 6
  { name: StepName.INSTALL_JAVA, weight: 24 }, // 30

  // Nexus ModLoader (coming soon)
  { name: StepName.CHECK_MODLOADER, weight: 2 }, // 32
  { name: StepName.DOWNLOAD_MODLOADER, weight: 6 }, // 38

  // Nexus Mods
  { name: StepName.FETCHING_MODS, weight: 2 }, // 40
  { name: StepName.UPDATING_MODS, weight: 27 }, // 67

  // MCLC
  { name: StepName.DOWNLOAD_MC, weight: 3 }, // 70
  { name: StepName.DOWNLOAD_ASSETS, weight: 27 }, // 97

  // Game
  { name: StepName.LAUNCHING, weight: 3 }, // 100
];

function getStepLabel(stepName, lang = 'en') {
  return labels[ lang ]?.[ stepName ] ?? stepName;
}

class ProgressManager {
  constructor(steps, emitCallback) {
    this.originalSteps = steps;
    this.steps = steps.map(step => ({ ...step, progress: 0 }));
    this.emitCallback = emitCallback;
    this.lastEmittedPercent = -1;
  }

  updateStep(name, progress) {
    progress = Math.max(0, Math.min(1, progress));

    const index = this.steps.findIndex(s => s.name === name);
    if (index === -1) return;

    const step = this.steps[ index ];

    if (progress < step.progress) return;

    for (let i = 0; i < index; i++) {
      if (this.steps[ i ].progress < 1) {
        this.steps[ i ].progress = 1;
      }
    }

    step.progress = progress;

    const current = this.getGlobalProgress();
    const currentPercent = Math.floor(current * 100);

    if (currentPercent !== this.lastEmittedPercent) {
      this.lastEmittedPercent = currentPercent;
      const label = getStepLabel(name, 'en'); // TODO: get current langage
      this.emitCallback(current, name, label);
    }
  }


  getGlobalProgress() {
    const totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);
    const current = this.steps.reduce((sum, step) => sum + (step.progress * step.weight), 0);
    return current / totalWeight;
  }

  reset() {
    this.steps = this.originalSteps.map(step => ({ ...step, progress: 0 }));
    this.lastEmittedPercent = -1;
    progressManager.updateStep(StepName.IDLE, 0);
  }
}

export const progressManager = new ProgressManager(stepsConfig, (value, stepName, label) => {
  logger.info(`Global Progress [${stepName}]: ${value}`);

  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('globalProgress', {
      value,
      stepName,
      label,
    });
  }
});

/*

      Callback Handlers

*/

// Nexus Java
export const handleJavaCallback = {
  onStep(step) {
    let progress = 0;

    switch (step) {
      case 'FETCHING': progress = 0.0; break;
      case 'DOWNLOADING': progress = 0.1; break;
      case 'EXTRACTING': progress = 0.5; break;
      case 'CLEANING': progress = 0.8; break;
      default: return;
    }

    progressManager.updateStep(StepName.INSTALL_JAVA, progress);
  }
}

// Nexus ModLoader
export function handleNexusModLoaderCallback(step) {
  let progress = 0;
  let stepName = StepName.DOWNLOAD_MODLOADER;

  console.debug(`debug handleNexusModLoaderCallback step: ${step}`);


  switch (step) {
    case 'CHECKING': progress = 0.1; StepName.CHECK_MODLOADER; break;
    case 'DOWNLOADING': progress = 0.5; break;
    default: return;
  }

  progressManager.updateStep(stepName, progress);
}

// Nexus Mods
export const handleNexusModsCallback = {
  onStep(step) {
    let progress = 0;
    let stepName = step.FETCHING_MODS;

    switch (step) {
      case 'FETCHING': progress = 0.1; break;
      case 'UPDATING': progress = 0.3; stepName = step.DOWNLOAD_MODS; break;
      default: return;
    }

    progressManager.updateStep(stepName, percent);
  },

  onProgress(downloaded, total, name) {
    const percent = total === 0 ? 0 : downloaded / total;
    progressManager.updateStep(StepName.DOWNLOAD_MODS, percent);

    console.debug(`debug onProgress: percent: ${percent}`);

  }
};



// MCLC
export function handleMCLCEvent(e) {
  let percent = 0;
  let stepName = StepName.DOWNLOAD_MC;


  switch (e.type) {
    case 'classes-maven-custom': percent = 0.1; break; // total 40
    case 'classes-custom': percent = 0.3; break; // total 35
    case 'classes': percent = 0.6; break; // total 88

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

  console.debug(`debug handleMCLCEvent e.type: ${e.type} | percent: ${percent}`);

  progressManager.updateStep(stepName, percent);
}
