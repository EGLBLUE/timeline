import { ALERT_ACCEPT, ALERT_CANCEL, showAlert } from "./alertModal.js";
import { destoryInterval, registerInterval } from "./intervalManagement.js";
import {
  addMarker,
  checkMarkers,
  initMarkersEvent,
  markerData,
  markerDragging,
  redrawMarkers,
  setMarkers,
  updaterMarkerPosition,
} from "./markers.js";
import {
  createPlayer,
  destroyPlayer,
  frameBackward,
  frameForward,
  playerSeekTo,
  toEndTime,
  toStartTime,
  vidPlayer,
} from "./player.js";
import {
  getVideoTitle,
  getVideoUrl,
  getYouTubeTimestamp,
  getYouTubeVideoId,
} from "./ytUtils.js";
import { isDirty, resetState, timelineData } from "./states.js";
import { muteVolume, setupVolumeSlider, setVolume } from "./volume.js";
import {
  playBtn,
  pauseBtn,
  Loading,
  timelineContainer,
  fpsLabel,
  timelineEl,
  videoUrlInput,
  VideoPlaceholderEl,
  loadNewVideoBtn,
  frameForwardBtn,
  frameBackwardBtn,
  toStartBtn,
  toEndBtn,
  addMarkerBtn,
  clearMarkersBtn,
  exportBtn,
  importBtn,
  zoomOutBtn,
  zoomInBtn,
  videoTitle,
  undoBtn,
  redoBtn,
  volumeBtn,
  volumeMutedBtn,
  markerLabelInput,
} from "./ui.js";
import {
  setupZoomControls,
  updateZoomLabel,
  zoomIn,
  zoomOut,
} from "./zoomControls.js";
import {
  drawTimelineTicks,
  startSync,
  updateHandlePosition,
  updateTimelineWidth,
  calcTimeFromPoint,
  centerScrollTimelineToFrame,
  initTotalTime,
} from "./timeline.js";
import {
  executeCommand,
  markSaved,
  redo,
  undo,
} from "./command/commandManager.js";
import {
  clearMarkersCommand,
  moveMarkerCommand,
} from "./command/markerCommands.js";
import {
  destroyKeyShortcuts,
  playPauseVideoKey,
  removePlayPauseVideoKey,
  setupKeyShortcuts,
} from "./keysEvent.js";

const YOUTUBE_ERRORS = {
  FETCH_FAILED: "Failed to fetch data from YouTube server",
  INVALID_URL: "Invalid YouTube URL or Video ID",
  NOT_FOUND: "Video not found or has been removed",
  EMBED_DISABLED: "Video does not allow embedding",
  PLAYBACK_ERROR: "Video cannot be played",
  URL_NOTVALID: "Please enter a valid YouTube URL",
  CURRENT_LIVE: "Live videos are not supported",
};

const disableWhenLoading = (disable = true) => {
  undoBtn.disabled = disable;
  redoBtn.disabled = disable;
  clearMarkersBtn.disabled = disable;
  exportBtn.disabled = disable;
  addMarkerBtn.disabled = disable;
  markerLabelInput.disabled = disable;
};

const loadingStart = () => {
  Loading.show();
  disableWhenLoading();
  destroyKeyShortcuts();
  removePlayPauseVideoKey();
};

const loadingStop = () => {
  Loading.hide();
  disableWhenLoading(false);
  setupKeyShortcuts();
  playPauseVideoKey();
};

const initVideoTitle = () => {
  timelineData.videoTitle = getVideoTitle(vidPlayer);
  videoTitle.textContent = `${timelineData.videoTitle}`;
};

const initFpsLabel = () => {
  fpsLabel.textContent = timelineData.fps;
};

const showVideoError = (message) => {
  VideoPlaceholderEl.textContent = message;
  VideoPlaceholderEl.style.display = "flex";
  console.error(message);
  loadingStop();
};
const hideVideoError = () => {
  VideoPlaceholderEl.style.display = "none";
};

const inputFocus = () => {
  videoUrlInput.scrollIntoView({ behavior: "smooth", block: "center" });

  requestAnimationFrame(() => {
    videoUrlInput.focus({ preventScroll: true });
    videoUrlInput.select();
  });
};

const loadYouTubeAPI = () => {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    const timer = setTimeout(() => {
      reject("YT API load timeout");
    }, 15000);

    tag.onerror = () => {
      reject("Failed to load YouTube Iframe API");
    };

    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      resolve();
    };
  });
};

const startYTAPILoader = async (maxRetry = 10) => {
  let attempt = 0;

  while (attempt < maxRetry) {
    try {
      await loadYouTubeAPI();
      return;
    } catch (err) {
      attempt++;
      console.info(`Retry load YouTube API... attempt: ${attempt}`);
      if (attempt >= maxRetry) {
        console.error(err);

        throw YOUTUBE_ERRORS.FETCH_FAILED;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
};

const setupPlayer = async () => {
  loadingStart();

  const errSetup = (errMsg, interval) => {
    destoryInterval(interval);
    destroyPlayer();
    showVideoError(errMsg);
    loadingStop();
    inputFocus();
  };

  if (!window.YT) {
    try {
      Loading.updateInfo("Load YouTube iframe");
      await startYTAPILoader();
    } catch (err) {
      showVideoError(err);
      return;
    }
  }

  destroyPlayer();
  Loading.updateInfo("Creating Player");
  await createPlayer(timelineData.currentVidId)
    .then(() => {
      hideVideoError();

      const d = vidPlayer.getDuration();
      vidPlayer.mute();
      timelineData.duration = d > 0 ? d : null;

      Loading.updateInfo("Checking Player");

      let playAttempts = 0;
      let setupCompleted = false;
      let readyInterval = null;

      const completeSetup = () => {
        if (setupCompleted) {
          if (readyInterval) destroyPlayer(readyInterval);
          return;
        }
        setupCompleted = true;

        readyInterval = setInterval(() => {
          vidPlayer.pauseVideo();
          const state = vidPlayer.getPlayerState();
          if (state === YT.PlayerState.PAUSED) {
            playerSeekTo(timelineData.initialSeek);

            destoryInterval(readyInterval);
            startSync();
            initVideoTitle();
            initTotalTime();
            updateTimelineWidth();
            centerScrollTimelineToFrame();
            updateZoomLabel();
            setVolume(timelineData.volumeLv);
            loadingStop();
            timelineData.initialSeek = 0;
          }
        }, 500);

        registerInterval(readyInterval);
      };

      const fetchInterval = setInterval(() => {
        const state = vidPlayer.getPlayerState();

        if (state === YT.PlayerState.PLAYING) {
          if (vidPlayer.playerInfo.videoData.isLive) {
            errSetup(YOUTUBE_ERRORS.CURRENT_LIVE, fetchInterval);
            return;
          }

          destoryInterval(fetchInterval);
          completeSetup();
        } else if (state == -1) {
          playAttempts++;
          if (playAttempts >= 30) {
            console.warn("Autoplay blocked by browser");
            destoryInterval(fetchInterval);
            completeSetup();
            return;
          }

          if (!vidPlayer.playerInfo.videoData.isPlayable) {
            errSetup(YOUTUBE_ERRORS.PLAYBACK_ERROR, fetchInterval);
            return;
          }
          if (playAttempts === 1 || playAttempts % 5 === 0) {
            vidPlayer.playVideo();
          }
        } else if (state === YT.PlayerState.BUFFERING) {
          playAttempts = 0;
        }
      }, 100);
      registerInterval(fetchInterval);
    })
    .catch((e) => {
      onPlayerError(e);
    });
};

const onPlayerError = (event) => {
  switch (event.data) {
    case 2:
      showVideoError(YOUTUBE_ERRORS.INVALID_URL);
      break;

    case 100:
      showVideoError(YOUTUBE_ERRORS.NOT_FOUND);
      break;

    case 101:
    case 150:
      showVideoError(YOUTUBE_ERRORS.EMBED_DISABLED);
      break;

    default:
      showVideoError("Failed getting data, try again after 1 minute.");
      console.error(event);
      break;
  }

  destroyPlayer();
};

const loadNewVideo = async (vidUrl, force = false) => {
  const vidId = getYouTubeVideoId(vidUrl);

  if (!vidId) {
    showAlert("Error", YOUTUBE_ERRORS.URL_NOTVALID, { alertDuration: 2 });
    return;
  }

  if (vidId == timelineData.currentVidId && !force && vidPlayer) return;

  if (isDirty) {
    const acc = await showAlert("Warning", "Save changes to storage?", {
      cancelBtn: true,
    });
    if (acc == ALERT_ACCEPT) {
      exportTimeline();
    } else if (acc == ALERT_CANCEL) {
      return;
    }
  }

  resetState();

  const tSeek = getYouTubeTimestamp(vidUrl);
  if (tSeek) timelineData.initialSeek = tSeek;
  timelineData.currentVidId = vidId;
  timelineData.currentVideoUrl = getVideoUrl(vidPlayer, vidId).videoUrl;
  setupPlayer();
};

export const exportTimeline = (force = true) => {
  if (!force && !isDirty) return;
  const { videoId, videoUrl } = getVideoUrl(vidPlayer);

  const totalFrames = Math.floor(timelineData.duration * timelineData.fps);
  const filename = `timeline-${
    timelineData.videoTitle && timelineData.videoTitle.length > 0
      ? timelineData.videoTitle
      : "Untitled"
  }.json`;

  markerData.list = checkMarkers(markerData.list);

  const data = {
    video: {
      videoUrl: videoUrl,
      videoId: videoId,
      title: timelineData.videoTitle,
      duration: timelineData.duration,
      totalFrames: totalFrames,
      currentTime: timelineData.currentTime,
    },
    markers: markerData.list,
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  markSaved();
};

export const importTimeline = async () => {
  if (isDirty) {
    const acc = await showAlert("Warning", "Save changes to storage?", {
      cancelBtn: true,
    });

    if (acc == ALERT_ACCEPT) {
      exportTimeline();
    } else if (acc == ALERT_CANCEL) {
      return;
    }
  }

  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = "application/json";
  inputFile.style.display = "none";

  inputFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);

        if (
          !data.video ||
          !data.video.videoUrl ||
          !Array.isArray(data.markers)
        ) {
          throw new Error("Invalid timeline JSON format");
        }

        data.markers = checkMarkers(data.markers);
        console.log("Timeline imported successfully");

        videoUrlInput.value = data.video.videoUrl;
        timelineData.initialSeek = data.video.currentTime
          ? data.video.currentTime
          : 0;
        loadNewVideo(data.video.videoUrl, true);
        setMarkers(data.markers);
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
      }
    };

    reader.readAsText(file);

    inputFile.value = "";
  };

  inputFile.click();
};

export const togglePlayPause = () => {
  if (!vidPlayer) return;
  const state = vidPlayer.getPlayerState();
  timelineData.isPlaying = state === YT.PlayerState.PLAYING ? true : false;

  if (timelineData.isPlaying) {
    vidPlayer.pauseVideo();
  } else {
    vidPlayer.playVideo();
  }
};

const initEventListeners = () => {
  timelineContainer.addEventListener("scroll", () => {
    const totalFrames = Math.floor(timelineData.duration * timelineData.fps);
    requestAnimationFrame(() => {
      drawTimelineTicks(totalFrames);
      redrawMarkers();
    });
  });

  timelineEl.addEventListener("mousedown", (e) => {
    timelineData.isDragging = true;
    const targetSec = calcTimeFromPoint(e);
    playerSeekTo(targetSec);
  });

  document.addEventListener("mousemove", (e) => {
    if (markerDragging.element) {
      const targetSec = calcTimeFromPoint(e);
      updaterMarkerPosition(markerDragging.element, targetSec);
      return;
    }
    if (timelineData.isDragging) {
      const targetSec = calcTimeFromPoint(e);
      playerSeekTo(targetSec);
    }
  });

  document.addEventListener("mouseup", () => {
    timelineData.isDragging = false;
    if (markerDragging.context)
      executeCommand(moveMarkerCommand(markerDragging.context));
    markerDragging.element = null;
    markerDragging.x = null;
    markerDragging.context = null;
  });
};
const initOnClick = () => {
  loadNewVideoBtn.onclick = () => {
    const videoUrl = videoUrlInput.value;
    if (videoUrl <= 0) return;
    loadNewVideo(videoUrl);
  };
  frameForwardBtn.onclick = () => frameForward();
  frameBackwardBtn.onclick = () => frameBackward();
  toStartBtn.onclick = () => toStartTime();
  toEndBtn.onclick = () => toEndTime();
  volumeBtn.onclick = () => muteVolume(true);
  volumeMutedBtn.onclick = () => muteVolume(false);
  addMarkerBtn.onclick = () => addMarker(timelineData.currentTime);
  clearMarkersBtn.onclick = () => executeCommand(clearMarkersCommand());
  exportBtn.onclick = () => exportTimeline();
  importBtn.onclick = async () => {
    importTimeline();
  };
  zoomOutBtn.onclick = () => zoomOut();
  zoomInBtn.onclick = () => zoomIn();
  playBtn.onclick = () => togglePlayPause();
  pauseBtn.onclick = () => togglePlayPause();
  undoBtn.onclick = () => undo();
  redoBtn.onclick = () => redo();
};

document.documentElement.dataset.theme = "dark";

window.onload = () => {
  initFpsLabel();
  setupZoomControls();
  setupVolumeSlider();

  updateTimelineWidth();
  centerScrollTimelineToFrame();
  updateZoomLabel();

  initEventListeners();
  initOnClick();
  initMarkersEvent();
  disableWhenLoading();
};

window.onresize = () => {
  updateTimelineWidth();
  redrawMarkers();
  updateHandlePosition();
};

window.addEventListener("beforeunload", (e) => {
  if (!isDirty) return;

  e.preventDefault();
  e.returnValue = "";
});
