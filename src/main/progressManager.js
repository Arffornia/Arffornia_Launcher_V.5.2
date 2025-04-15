import { getMainWindow, logger } from ".";

const StepName = Object.freeze({
  CHECK_JAVA: 'CHECK_JAVA',
  INSTALL_JAVA: 'INSTALL_JAVA',
  DOWNLOAD_MC: 'DOWNLOAD_MC',
  DOWNLOAD_MODS: 'DOWNLOAD_MODS',
  DOWNLOAD_ASSETS: 'DOWNLOAD_ASSETS',
});

const labels = {
  en: {
    CHECK_JAVA: "Checking Java",
    INSTALL_JAVA: "Installing Java",
    DOWNLOAD_MC: "Downloading Minecraft",
    DOWNLOAD_MODS: "Downloading Mods",
    DOWNLOAD_ASSETS: "Downloading Assets",
  },
};

const stepsConfig = [
  { name: StepName.CHECK_JAVA, weight: 10 },
  { name: StepName.INSTALL_JAVA, weight: 15 },
  { name: StepName.DOWNLOAD_MC, weight: 30 },
  { name: StepName.DOWNLOAD_MODS, weight: 20 },
  { name: StepName.DOWNLOAD_ASSETS, weight: 25 },
];

function getStepLabel(stepName, lang = 'en') {
  return labels[lang]?.[stepName] ?? stepName;
}


class ProgressManager {
  constructor(steps, emitCallback) {
    this.originalSteps = steps;
    this.steps = steps.map(s => ({ ...s, progress: 0 }));
    this.emitCallback = emitCallback;
    this.lastEmittedPercent = -1;
  }

  updateStep(name, progress) {
    const step = this.steps.find(s => s.name === name);
    if (!step) return;

    step.progress = Math.max(0, Math.min(1, progress));
    const current = this.getGlobalProgress();
    const currentPercent = Math.floor(current * 100);

    if (currentPercent !== this.lastEmittedPercent) {
      this.lastEmittedPercent = currentPercent;
      const label = getStepLabel(name, 'en');
      this.emitCallback(current, name, label);
    }
  }

  getGlobalProgress() {
    const totalWeight = this.steps.reduce((a, s) => a + s.weight, 0);
    const current = this.steps.reduce((acc, s) => acc + (s.progress * s.weight), 0);
    return current / totalWeight;
  }

  reset() {
    this.steps = this.originalSteps.map(s => ({ ...s, progress: 0 }));
    this.lastEmittedPercent = -1;
  }
}


const progressManager = new ProgressManager(stepsConfig, (value, stepName, label) => {
  logger.info(`Progress [${stepName}]: ${value}`);

  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('globalProgress', {
      value,
      stepName,
      label,
    });
  }
});


export function handleJavaCallback(step) {
  let progress = 0;

  switch (step) {
    case 'FETCHING': progress = 0.1; break;
    case 'UPDATING': progress = 0.5; break;
    case 'DONE': progress = 1; break;
    default: progress = 0;
  }

  progressManager.updateStep(StepName.INSTALL_JAVA, progress);
}

export function handleMCLCEvent(e) {
  const percent = e.total === 0 ? 0 : e.task / e.total;
  let stepName = StepName.DOWNLOAD_MC;

  switch (e.type) {
    case 'download': stepName = StepName.DOWNLOAD_MC; break;
    case 'asset': stepName = StepName.DOWNLOAD_ASSETS; break;
    case 'mod': stepName = StepName.DOWNLOAD_MODS; break;
  }

  progressManager.updateStep(stepName, percent);
}
