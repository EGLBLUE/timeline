import { vidPlayer } from "./player.js";
import { timelineData } from "./states.js";
import {
  currentTimeDisplay,
  durationDisplay,
  frameDisplay,
  frameTicksEl,
  timelineContainer,
  timelineEl,
  timelineHandleEl,
  totalFrameDisplay,
} from "./ui.js";
import { formatTime } from "./utils.js";

const TIME_INTERVALS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];

let rafId = null;

export const scrollTimelineToPosition = (handlePos) => {
  const containerLeft = timelineContainer.scrollLeft;
  const containerWidth = timelineContainer.clientWidth;

  const scrollMargin = 30;

  if (handlePos > containerLeft + containerWidth - scrollMargin) {
    timelineContainer.scrollLeft = handlePos - containerWidth + scrollMargin;
  }

  if (handlePos < containerLeft + scrollMargin) {
    timelineContainer.scrollLeft = Math.max(0, handlePos - scrollMargin);
  }
};

const pickFrameInterval = (minPx) => {
  for (const f of TIME_INTERVALS) {
    const px = f * timelineData.frameWidth;
    if (px >= minPx) return f;
  }
  return TIME_INTERVALS.at(-1);
};

export const startSync = () => {
  if (rafId) return;

  const sync = () => {
    if (!vidPlayer || !timelineData.isPlaying) return;

    if (!timelineData.isDragging) {
      try {
        timelineData.currentTime = vidPlayer.getCurrentTime();
        updateHandlePosition();
      } catch (e) {
        console.error("Sync error:", e);
      }
    }
    rafId = requestAnimationFrame(sync);
  };

  sync();
};

export const stopSync = () => {
  cancelAnimationFrame(rafId);
  rafId = null;
};

export const updateTimelineWidth = () => {
  if (!timelineData.duration || timelineData.duration === 0) return;

  const totalFrames = Math.floor(timelineData.duration * timelineData.fps);
  const timelineWidth = Math.max(100, totalFrames * timelineData.frameWidth);

  if (timelineEl) {
    timelineEl.style.width = timelineWidth + "px";

    requestAnimationFrame(() => {
      drawTimelineTicks(totalFrames);
    });
  }
};

export const drawTimelineTicks = (totalFrames) => {
  if (!frameTicksEl || !timelineContainer) return;

  frameTicksEl.innerHTML = "";

  const scrollLeft = timelineContainer.scrollLeft;
  const viewWidth = timelineContainer.clientWidth;

  const startFrame = Math.floor(scrollLeft / timelineData.frameWidth);
  const endFrame = Math.min(
    totalFrames,
    Math.ceil((scrollLeft + viewWidth) / timelineData.frameWidth)
  );

  const minorF = pickFrameInterval(10);
  const majorF = pickFrameInterval(40);
  const labelF = pickFrameInterval(80);

  const firstFrame = Math.floor(startFrame / minorF) * minorF;

  for (let f = firstFrame; f <= endFrame; f += minorF) {
    if (f < 0 || f > totalFrames) continue;

    const tick = document.createElement("div");
    tick.style.left = f * timelineData.frameWidth + "px";

    if (f % labelF === 0) {
      tick.className = "tick label";
      const label = document.createElement("span");
      label.textContent = formatTime(f / timelineData.fps);
      tick.appendChild(label);
    } else if (f % majorF === 0) {
      tick.className = "tick major";
    } else {
      tick.className = "tick minor";
    }

    frameTicksEl.appendChild(tick);
  }
};

export const centerScrollTimelineToFrame = () => {
  const handlePos =
    Math.floor(timelineData.currentTime * timelineData.fps) *
    timelineData.frameWidth;
  const targetScroll = handlePos - timelineContainer.clientWidth / 2;

  timelineContainer.scrollLeft = Math.max(0, targetScroll);
};
export const getFramePosition = (targetTime) => {
  const frame = Math.floor(targetTime * timelineData.fps);
  return frame * timelineData.frameWidth;
};

export const updateHandlePosition = () => {
  const handlePos = getFramePosition(timelineData.currentTime);
  timelineHandleEl.style.left = handlePos + "px";
  scrollTimelineToPosition(handlePos);
};

export const initTotalTime = () => {
  durationDisplay.textContent = formatTime(timelineData.duration);
  const totalFrames = Math.floor(timelineData.duration * timelineData.fps);
  totalFrameDisplay.textContent = totalFrames;
};

export const updateTimeCodeDisplay = () => {
  currentTimeDisplay.textContent = formatTime(timelineData.currentTime);
  frameDisplay.textContent = Math.floor(
    timelineData.currentTime * timelineData.fps
  );
};

export const calcTimeFromPoint = (e) => {
  const rect = timelineEl.getBoundingClientRect();
  let x = e.clientX - rect.left;

  const totalFrames = Math.floor(timelineData.duration * timelineData.fps);
  const timelineWidth = totalFrames * timelineData.frameWidth;

  x = Math.max(0, Math.min(x, timelineWidth));
  const currentFrame = Math.round(x / timelineData.frameWidth);

  const targetSec = currentFrame / timelineData.fps;
  return targetSec;
};
