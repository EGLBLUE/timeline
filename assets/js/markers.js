import { showAlert } from "./alertModal.js";
import {
  AddMarkerCommand,
  CloseMarkerCommand,
  removeMarkerCommand,
} from "./command/markerCommands.js";
import { executeCommand } from "./command/commandManager.js";
import { playerSeekTo, vidPlayer } from "./player.js";
import { timelineData } from "./states.js";
import { btnRemoveSvg } from "./svgs.js";
import {
  centerScrollTimelineToFrame,
  getFramePosition,
  scrollTimelineToPosition,
} from "./timeline.js";
import { markerLabelInput, markerList, markersContainer } from "./ui.js";
import { formatTime } from "./utils.js";

const MIN_MARKER_DURATION = 3;
export const MARKER = {
  START: "START",
  STOP: "STOP",
};

let markerTooltip = null;

const checkToolTip = (create = false) => {
  markerTooltip = markersContainer.querySelector(".marker-tooltip");
  if (!markerTooltip) {
    if (create) {
      markerTooltip = document.createElement("div");
      markerTooltip.className = "marker-tooltip";
      markersContainer.appendChild(markerTooltip);
      return false;
    } else return false;
  }
  return true;
};

export let markerData = {
  list: [],
  activeMarker: null,
};
export let markerDragging = {
  element: null,
  x: null,
  context: null,
};
const normalizeDurationMarkers = (markers) => {
  return markers.map((m) => {
    if (m.startTime == null || m.endTime == null) return m;

    let startTime = m.startTime;
    let endTime = m.endTime;

    if (startTime > endTime) {
      [startTime, endTime] = [endTime, startTime];
    }

    if (endTime - startTime < MIN_MARKER_DURATION) {
      endTime = startTime + MIN_MARKER_DURATION;
    }

    return {
      ...m,
      startTime,
      endTime,
    };
  });
};

const showTooltip = (flagEl) => {
  checkToolTip(true);
  const marker = markerData.list.find((e) => e.id == flagEl.dataset.markerId);
  if (!marker) return;

  const text = marker.label;

  markerTooltip.textContent = text;
  markerTooltip.style.opacity = 1;

  const flagRect = flagEl.getBoundingClientRect();
  const parentRect = markersContainer.getBoundingClientRect();

  const x = flagRect.left - parentRect.left + flagRect.width / 2 + 10;
  const y = flagRect.top - parentRect.top - 1;

  markerTooltip.style.left = `${x}px`;
  markerTooltip.style.top = `${y}px`;
};

const hideTooltip = () => {
  if (checkToolTip()) markerTooltip.style.opacity = 0;
};

const getNextMarkerId = () => {
  const existingIds = markerData.list
    .map((item) => item.id)
    .sort((a, b) => a - b);

  if (existingIds.length === 0) {
    return 1;
  }
  const idSet = new Set(existingIds);
  const maxId = Math.max(...existingIds);

  for (let i = 1; i < maxId; i++) {
    if (!idSet.has(i)) {
      return i;
    }
  }
  return maxId + 1;
};
const handleDragMarker = (markerEl, clientX) => {
  const markerId = Number(markerEl.dataset.markerId);
  const type = markerEl.dataset.marker;
  const marker = markerData.list.find((m) => m.id === markerId);
  if (!marker) return;
  markerDragging.element = markerEl;
  markerDragging.x = clientX;
  markerDragging.context = {
    markerId,
    type,
    fromTime: type === MARKER.START ? marker.startTime : marker.endTime,
  };
};

export const initMarkersEvent = () => {
  markersContainer.addEventListener("mousedown", (e) => {
    const markerEl = e.target.closest(".marker-line");

    if (!markerEl) return;
    handleDragMarker(markerEl, e.clientX);
  });

  markersContainer.addEventListener("mouseover", (e) => {
    const flagEl = e.target.closest(".marker-flag");
    if (!flagEl || !markersContainer.contains(flagEl)) return;
    showTooltip(flagEl);
  });

  markersContainer.addEventListener("mouseout", (e) => {
    const flagEl = e.target.closest(".marker-flag");
    if (!flagEl || !markersContainer.contains(flagEl)) return;

    hideTooltip();
  });
  markerList.addEventListener("change", (e) => {
    const input = e.target;
    if (!input.matches("input[data-marker-id]")) return;

    const id = Number(input.dataset.markerId);
    const marker = markerData.list.find((m) => m.id === id);
    if (!marker) return;

    marker.label = input.value;
  });
};

export const cleanUpBrokenMarkers = (markers) =>
  markers.filter((m) => m.endTime !== null);

export const checkMarkers = (markers) => {
  markers = cleanUpBrokenMarkers(markers);
  return normalizeDurationMarkers(markers);
};

export const setMarkers = (newMarkers) => {
  markerData.list = newMarkers;
  updateMarker();
};

export const updateMarker = () => {
  redrawMarkers();
  updateMarkerList();
  hideTooltip();
};

export const createMarker = (time) => {
  const id = getNextMarkerId();
  return {
    id,
    startTime: time,
    endTime: null,
    label: markerLabelInput.value || `Marker ${id}`,
  };
};

export const stopMarker = (time) => {
  const deltaTime = Math.abs(time - markerData.activeMarker.startTime);

  if (deltaTime < MIN_MARKER_DURATION) {
    showAlert(
      "Error",
      `Minimum duration required is ${MIN_MARKER_DURATION} seconds.`,
      { alertDuration: 2 }
    );

    return false;
  }

  markerData.activeMarker.endTime = time;

  if (markerData.activeMarker.startTime > time) {
    const m = markerData.activeMarker;
    [m.startTime, m.endTime] = [m.endTime, m.startTime];
  }
  markerData.activeMarker = null;
  return true;
};

export const addMarker = (time) => {
  if (markerData.activeMarker) {
    executeCommand(CloseMarkerCommand(time));
  } else {
    executeCommand(AddMarkerCommand(time));
  }

  markerLabelInput.value = "";
};

export const restoreMarkers = (markers) => {
  markers.forEach(({ m, i }) => {
    markerData.list.splice(i, 0, m);
  });
};
export const clearMarkers = (force = false) => {
  if (force) {
    markerData.list = [];
    markerData.activeMarker = null;
    markerList.innerHTML = "";
    return;
  }

  if (markerData.list.length <= 0) return false;
  const removed = markerData.list.map((m, i) => ({ m, i }));
  markerData.list.length = 0;
  markerData.activeMarker = null;
  return removed;
};

export const removeMarker = (markerId) => {
  const index = markerData.list.findIndex((m) => m.id == markerId);
  if (index < 0) return;
  if (markerData.activeMarker && markerData.activeMarker.id == markerId)
    markerData.activeMarker = null;
  return { index, removed: markerData.list.splice(index, 1)[0] };
};

const jumpToMarker = (time) => {
  playerSeekTo(time);
  centerScrollTimelineToFrame();
};

export const updaterMarkerPosition = (markerEl, targetSec) => {
  const marker = markerData.list.find((i) => i.id == markerEl.dataset.markerId);
  if (!marker) return;

  const markerType = markerEl.dataset.marker;
  let newPos = targetSec;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  if (markerType === MARKER.START && marker.endTime != null) {
    newPos = clamp(targetSec, 0, marker.endTime - MIN_MARKER_DURATION);
  }

  if (markerType === MARKER.STOP && marker.startTime != null) {
    newPos = clamp(
      targetSec,
      marker.startTime + MIN_MARKER_DURATION,
      timelineData.duration
    );
  }

  const markerPos = getFramePosition(newPos);
  markerEl.style.left = markerPos + "px";
  scrollTimelineToPosition(markerPos);

  if (markerType === MARKER.START) marker.startTime = newPos;
  else marker.endTime = newPos;

  updateMarker();
};

const clearTimelineMarkers = () => {
  [...markersContainer.children].forEach((e) => {
    if (!e.classList.contains("marker-tooltip"))
      markersContainer.removeChild(e);
  });
};
export const redrawMarkers = () => {
  clearTimelineMarkers();
  markerData.list.forEach((marker) => {
    const markerEl = document.createElement("div");
    const startX =
      marker.startTime * timelineData.fps * timelineData.frameWidth;
    const frame = marker.endTime * timelineData.fps;
    const endX = frame ? frame * timelineData.frameWidth : startX;
    markerEl.className = "marker-range";
    markerEl.style.left = startX + "px";
    markerEl.style.width = Math.max(4, endX - startX) + "px";

    const startLine = document.createElement("div");
    startLine.className = "marker-line start";
    startLine.style.left = "0px";
    startLine.dataset.markerId = marker.id;
    startLine.dataset.marker = MARKER.START;
    startLine.dataset.time = marker.startTime;

    const flagStart = document.createElement("div");
    flagStart.className = "marker-flag start";
    flagStart.textContent = marker.id;
    flagStart.dataset.markerId = marker.id;
    flagStart.dataset.label = marker.label;
    flagStart.onclick = () => {
      jumpToMarker(marker.startTime, vidPlayer);
    };

    startLine.appendChild(flagStart);
    markerEl.appendChild(startLine);

    if (marker.endTime) {
      const stopLine = document.createElement("div");
      stopLine.className = "marker-line end";
      stopLine.style.left = endX - startX + "px";
      stopLine.dataset.markerId = marker.id;
      stopLine.dataset.marker = MARKER.STOP;
      stopLine.dataset.time = marker.endTime;

      const flagStop = document.createElement("div");
      flagStop.className = "marker-flag stop";
      flagStop.textContent = marker.id;
      flagStop.dataset.markerId = marker.id;
      flagStop.dataset.label = marker.label;
      flagStop.onclick = () => {
        jumpToMarker(marker.endTime);
      };
      stopLine.appendChild(flagStop);
      markerEl.dataset.stop = `${marker.endTime}`;
      markerEl.appendChild(stopLine);
    }
    markersContainer.appendChild(markerEl);
  });
};

const addMarkerList = (marker) => {
  const item = document.createElement("div");
  item.className = "marker-item";
  item.dataset.markerId = marker.id;
  const markerTimeWrapper = document.createElement("span");
  markerTimeWrapper.className = "marker-times";

  const markerIdDisplay = document.createElement("span");
  markerIdDisplay.className = "marker-id-display";
  markerIdDisplay.textContent = `#${marker.id}`;
  markerIdDisplay.disabled = true;

  const markerLabel = document.createElement("input");
  markerLabel.id = "markerLabelEdit";
  markerLabel.className = "marker-label marker-input";
  markerLabel.dataset.markerId = marker.id;
  markerLabel.type = "text";
  markerLabel.maxLength = 240;

  const startText = formatTime(marker.startTime);
  const startTimeEl = document.createElement("span");
  startTimeEl.className = "marker-time";
  startTimeEl.textContent = startText;
  startTimeEl.onclick = () => jumpToMarker(marker.startTime);

  markerTimeWrapper.appendChild(startTimeEl);

  const arrowR = document.createElement("span");
  arrowR.innerHTML = "->";
  markerTimeWrapper.appendChild(arrowR);

  if (marker.endTime) {
    const endText = formatTime(marker.endTime);
    const endTimeEl = document.createElement("span");
    endTimeEl.className = "marker-time";
    endTimeEl.textContent = endText;
    endTimeEl.onclick = () => jumpToMarker(marker.endTime);
    markerTimeWrapper.appendChild(endTimeEl);
  } else {
    const endText = document.createElement("span");
    endText.innerHTML = "--:--:--";
    markerTimeWrapper.appendChild(endText);
  }

  markerLabel.value = `${marker.label}`;

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-remove";
  removeBtn.innerHTML = btnRemoveSvg;
  removeBtn.onclick = () => {
    executeCommand(removeMarkerCommand(marker.id));
  };

  item.appendChild(markerIdDisplay);
  item.appendChild(markerLabel);
  item.appendChild(markerTimeWrapper);
  item.appendChild(removeBtn);
  markerList.appendChild(item);
};

export const updateMarkerList = () => {
  markerList.innerHTML = "";

  markerData.list.forEach((marker) => {
    addMarkerList(marker);
  });
};
