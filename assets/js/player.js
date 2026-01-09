import { destoryIntervals } from "./intervalManagement.js";
import { timelineData } from "./states.js";
import {
  startSync,
  stopSync,
  updateHandlePosition,
  updateTimeCodeDisplay,
} from "./timeline.js";
import { timelineContainer } from "./ui.js";

const onStateChange = (event) => {
  if (event.data === YT.PlayerState.PLAYING) {
    timelineData.isPlaying = true;
    startSync();
    playBtn.style.display = "none";
    pauseBtn.style.display = "flex";
    timelineContainer.classList.add("no-scroll");
  } else if (
    event.data === YT.PlayerState.PAUSED ||
    event.data === YT.PlayerState.ENDED
  ) {
    timelineData.isPlaying = false;
    stopSync();
    updateTimeCodeDisplay();
    playBtn.style.display = "flex";
    pauseBtn.style.display = "none";
    timelineContainer.classList.remove("no-scroll");
  }
};
export let vidPlayer = null;

export const createPlayer = (videoId) => {
  return new Promise((resolve, reject) => {
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject("YT Player init timeout");
      }
    }, 15000);

    vidPlayer = new YT.Player("youtube-player", {
      videoId,
      playerVars: {
        rel: 0,
        autoplay: 1,
        modestbranding: 1,
        fs: 0,
        disablekb: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve();
        },
        onStateChange: onStateChange,
        onError: (e) => {
          if (done) return;

          done = true;
          clearTimeout(timer);
          reject(e);
        },
      },
    });
  });
};

export const playerSeekTo = (time) => {
  if (!vidPlayer) return;
  vidPlayer.seekTo(time);
  timelineData.currentTime = time;
  updateHandlePosition();
  updateTimeCodeDisplay();
};

export const destroyPlayer = () => {
  if (!vidPlayer) return;

  vidPlayer.destroy();
  vidPlayer = null;
  destoryIntervals();
};

export const toStartTime = () => {
  playerSeekTo(0);
};
export const toEndTime = () => {
  playerSeekTo(Math.floor(timelineData.duration - 5));
};
export const frameForward = () => {
  const current = timelineData.currentTime;
  const nextFrame = current + 1 / timelineData.fps;
  playerSeekTo(Math.min(nextFrame, timelineData.duration));
};

export const frameBackward = () => {
  const current = timelineData.currentTime;
  const prevFrame = current - 1 / timelineData.fps;
  playerSeekTo(Math.max(0, prevFrame));
};
