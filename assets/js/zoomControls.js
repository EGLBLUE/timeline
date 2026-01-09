import { redrawMarkers } from "./markers.js";

import { timelineData } from "./states.js";
import {
  centerScrollTimelineToFrame,
  updateHandlePosition,
  updateTimelineWidth,
} from "./timeline.js";
import { timelineContainer, zoomLabel, zoomSlider } from "./ui.js";

const maxFrameWidth = 20;
const minFrameWidth = 0.018;
const ZOOM_PRESETS = [0.5, 1.25, 2.5, 5, 10, 20];
const SNAP_THRESHOLD = 0.08;

const softSnapZoom = (value) => {
  for (const preset of ZOOM_PRESETS) {
    const ratio = Math.abs(value - preset) / preset;
    if (ratio < SNAP_THRESHOLD) {
      return {
        snapped: true,
        value: preset,
      };
    }
  }
  return {
    snapped: false,
    value,
  };
};

const setZoom = (value, snapping = true, options = {}) => {
  const { preserveMousePosition = false, mouseX = 0, scrollLeft = 0 } = options;

  let timeBeforeZoom;
  if (preserveMousePosition) {
    const relativeX = scrollLeft + mouseX;
    timeBeforeZoom = relativeX / (timelineData.fps * timelineData.frameWidth);
  }
  let zoomVal = (value = Math.max(
    minFrameWidth,
    Math.min(maxFrameWidth, value)
  ));
  if (snapping) {
    const clamped = Math.max(minFrameWidth, Math.min(maxFrameWidth, value));
    const snap = softSnapZoom(clamped);
    zoomVal = snap.value;
  }

  timelineData.frameWidth = zoomVal;
  updateZoomLabel();
  updateTimelineWidth();
  updateHandlePosition();
  redrawMarkers();

  if (zoomSlider) {
    zoomSlider.value = timelineData.frameWidth;
  }

  if (preserveMousePosition && timeBeforeZoom !== undefined) {
    const newScrollLeft =
      timeBeforeZoom * timelineData.fps * timelineData.frameWidth - mouseX;
    timelineContainer.scrollLeft = Math.max(0, newScrollLeft);
  } else {
    centerScrollTimelineToFrame();
  }
};

export const setupZoomControls = () => {
  setupMouseWheelZoom();
  setupZoomSlider();
  updateZoomLabel();
};

const setupZoomSlider = () => {
  if (!zoomSlider) return;

  zoomSlider.min = minFrameWidth;
  zoomSlider.max = maxFrameWidth;
  zoomSlider.value = timelineData.frameWidth;
  zoomSlider.step = 0.01;

  zoomSlider.addEventListener("input", (e) => {
    setZoom(parseFloat(e.target.value));
  });
};

const setupMouseWheelZoom = () => {
  if (!timelineContainer) return;

  timelineContainer.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();

        const zoomSpeed = 0.5;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = timelineData.frameWidth + delta;

        const rect = timelineContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scrollLeft = timelineContainer.scrollLeft;

        setZoom(newZoom, false, {
          preserveMousePosition: false,
          mouseX: mouseX,
          scrollLeft: scrollLeft,
        });
      }
    },
    { passive: false }
  );
};
const getZoomStep = (frameWidth) => {
  if (frameWidth < 2) return 0.1;
  if (frameWidth < 5) return 0.2;
  return 0.5;
};

const zoom = (direction) => {
  const { frameWidth } = timelineData;
  const limit = direction === "in" ? maxFrameWidth : minFrameWidth;
  const shouldStop =
    direction === "in" ? frameWidth >= limit : frameWidth <= limit;

  if (shouldStop) return;

  const step = getZoomStep(frameWidth);
  const newWidth = direction === "in" ? frameWidth + step : frameWidth - step;

  setZoom(newWidth, false);
};

export const zoomIn = () => zoom("in");
export const zoomOut = () => zoom("out");

export const updateZoomLabel = () => {
  if (zoomLabel) {
    const baseWidth = 5;
    const zoomPercent = Math.round((timelineData.frameWidth / baseWidth) * 100);
    zoomLabel.textContent = `${zoomPercent}%`;
  }
};
