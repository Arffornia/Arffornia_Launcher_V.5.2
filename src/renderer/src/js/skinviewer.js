import * as skinview3d from 'skinview3d';

export async function initializeSkinViewers() {
  const elements = document.getElementsByClassName("skin_viewer");

  function rdFromRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  async function checkMinecraftUsername(username) {
    const url = `https://mineskin.eu/skin/${username}`;

    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      window.api.logger("error", `Failed to fetch skin : ${error}`);
      return false;
    }
  }

  Array.from(elements).forEach(async element => {
    var username = element.getAttribute('data-username');
    var isControl = element.getAttribute('data-control');
    var overrideWidth = parseInt(element.getAttribute('data-width'), 10);
    var overrideHeight = parseInt(element.getAttribute('data-height'), 10);

    const isValidUsername = await checkMinecraftUsername(username);
    if (!isValidUsername) {
      username = "Steve";
    }

    const viewer = new skinview3d.SkinViewer({
      canvas: element,
      width: overrideWidth || 200,
      height: overrideHeight || 300,
      skin: `https://mineskin.eu/skin/${username}`,
      enableControls: true
    });

    viewer.animation = new skinview3d.WalkingAnimation();
    viewer.animation.speed = rdFromRange(0.35, 0.6);
    viewer.animation.progress = rdFromRange(0, 100);
    viewer.controls.enabled = isControl === "true";
  });
}
