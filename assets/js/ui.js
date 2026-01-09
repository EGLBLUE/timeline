export const unsavedChangesEl = document.getElementById("unsavedChanges");
export const videoTitle = document.getElementById("videoTitle");
export const videoUrlInput = document.getElementById("videoUrlInput");
export const VideoPlaceholderEl = document.getElementById("video-placeholder");

export const undoBtn = document.getElementById("undoBtn");
export const redoBtn = document.getElementById("redoBtn");

export const playBtn = document.getElementById("playBtn");
export const pauseBtn = document.getElementById("pauseBtn");
export const volumeBtn = document.getElementById("volumeBtn");
export const volumeMutedBtn = document.getElementById("volumeMutedBtn");
export const volumeSlider = document.getElementById("volumeSlider");
export const fpsLabel = document.getElementById("fpsLabel");
export const timelineEl = document.getElementById("timeline");

export const currentTimeDisplay = document.getElementById("currentTimeDisplay");
export const durationDisplay = document.getElementById("durationDisplay");
export const frameDisplay = document.getElementById("frameDisplay");
export const totalFrameDisplay = document.getElementById("totalFrameDisplay");
export const markerLabelInput = document.getElementById("markerLabelInput");
export const timelineContainer = document.getElementById("timelineContainer");
export const timelineHandleEl = document.getElementById("timelineHandle");
export const frameTicksEl = document.getElementById("frameTicks");

export const markersContainer = document.getElementById("markersContainer");
export const markerList = document.getElementById("markerList");

export const zoomControls = document.querySelector(".zoom-controls");
export const zoomSlider = document.getElementById("zoomSlider");
export const zoomLabel = document.getElementById("zoomLabel");

export const alertTitleEl = document.getElementById("alert-title");
export const alertMessageEl = document.getElementById("alert-message");
export const alertModal = document.getElementById("alertModal");
export const alertOkBtn = document.getElementById("alertOk");
export const alertNoBtn = document.getElementById("alertNo");
export const alertCancelBtn = document.getElementById("alertCancel");
export const alertBtns = document.querySelector(".alert-btns");

export const loadNewVideoBtn = document.getElementById("loadNewVideoBtn");
export const frameForwardBtn = document.getElementById("frameForwardBtn");
export const frameBackwardBtn = document.getElementById("frameBackwardBtn");

export const toStartBtn = document.getElementById("toStartBtn");
export const toEndBtn = document.getElementById("toEndBtn");
export const addMarkerBtn = document.getElementById("addMarkerBtn");
export const clearMarkersBtn = document.getElementById("clearMarkersBtn");
export const exportBtn = document.getElementById("exportBtn");
export const importBtn = document.getElementById("importBtn");
export const zoomOutBtn = document.getElementById("zoomOutBtn");
export const zoomInBtn = document.getElementById("zoomInBtn");

export const Loading = {
  el: document.getElementById("loading-overlay"),

  updateInfo(text) {
    this.el.querySelector(".loading-text").textContent = text + "...";
  },

  show(text = "") {
    this.el.querySelector(".loading-text").textContent = text;
    this.el.classList.add("active");
  },

  hide() {
    if (this.el.classList.contains("active"))
      this.el.classList.remove("active");
  },
};
