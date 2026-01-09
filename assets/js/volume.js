import { vidPlayer } from "./player.js";
import { timelineData } from "./states.js";
import { volumeBtn, volumeMutedBtn, volumeSlider } from "./ui.js";

let lastVolume = null;
let lastMuted = null;

export const muteVolume = (mute) => {
  if (timelineData.volumeLv > 0) lastVolume = timelineData.volumeLv;
  setVolume(mute ? 0 : lastVolume);
};

export const setVolume = (lv) => {
  if (vidPlayer) {
    lv > 0 ? vidPlayer.unMute() : vidPlayer.mute();
    vidPlayer.setVolume(Math.max(0, Math.min(100, lv)));
  }

  if (lv > 0) {
    volumeMutedBtn.classList.remove("active");
    volumeBtn.classList.add("active");
    timelineData.isMuted = false;
  } else {
    volumeBtn.classList.remove("active");
    volumeMutedBtn.classList.add("active");
    timelineData.isMuted = true;
  }

  volumeSlider.value = lv;
};
export const setupVolumeSlider = () => {
  volumeSlider.value = timelineData.volumeLv;
  volumeSlider.addEventListener("input", (e) => {
    timelineData.volumeLv = e.target.value;
    setVolume(timelineData.volumeLv);
  });
};
const onVolumeChanged = (volume, muted) => {
  if (volumeSlider && !volumeSlider.matches(":active")) {
    if (muted) {
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = volume;
    }
  }
};
export const syncVolumeState = () => {
  try {
    timelineData.volumeLv = vidPlayer.getVolume();
    timelineData.isMuted = vidPlayer.isMuted();

    if (
      timelineData.volumeLv !== lastVolume ||
      timelineData.isMuted !== lastMuted
    ) {
      lastVolume = timelineData.volumeLv;
      lastMuted = timelineData.isMuted;

      onVolumeChanged(timelineData.volumeLv, timelineData.isMuted);
    }
  } catch (e) {
    return;
  }
};
