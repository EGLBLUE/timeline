import { resetStacks } from "./command/commandManager.js";
import { clearMarkers } from "./markers.js";
import { unsavedChangesEl } from "./ui.js";

export let isDirty = false;

export const setIsDirty = (d) => {
  if (d) {
    unsavedChangesEl.textContent = "*";
  } else {
    unsavedChangesEl.textContent = "";
  }
  isDirty = d;
};

export const timelineData = {
  volumeLv: 100,
  isMuted: false,
  frameWidth: 5,
  currentVideoUrl: null,
  currentVidId: null,
  duration: 0,
  fps: 30,
  currentTime: 0,
  isPlaying: false,
  isDragging: false,
  videoTitle: null,
  initialSeek: 0,
};

const resetTimelineData = () => {
  timelineData.currentVideoUrl = null;
  timelineData.currentVidId = null;
  timelineData.duration = null;
  timelineData.fps = 30;
  timelineData.currentTime = 0;
  timelineData.isPlaying = false;
  timelineData.isDragging = false;
  timelineData.videoTitle = null;
};

export const resetState = () => {
  resetTimelineData();
  resetStacks();
  clearMarkers(true);
  setIsDirty(false);
};
