import { executeCommand, redo, undo } from "./command/commandManager.js";
import { clearMarkersCommand } from "./command/markerCommands.js";
import { exportTimeline, importTimeline, togglePlayPause } from "./main.js";
import { addMarker } from "./markers.js";
import {
  frameBackward,
  frameForward,
  toEndTime,
  toStartTime,
} from "./player.js";
import { timelineData } from "./states.js";
import { muteVolume } from "./volume.js";
import { zoomIn, zoomOut } from "./zoomControls.js";

const checkIgnoreElements = () => {
  const el = document.activeElement;
  if (
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable)
  )
    return true;
  return false;
};

const keyboardHandler = (e) => {
  if (checkIgnoreElements()) return;

  if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.shiftKey)
    muteVolume(!timelineData.isMuted);
  else if (e.ctrlKey && e.key.toLowerCase() === "s" && !e.shiftKey) {
    e.preventDefault();
    exportTimeline(false);
  } else if (e.ctrlKey && e.key.toLowerCase() === "i" && !e.shiftKey) {
    e.preventDefault();
    importTimeline();
  } else if (e.ctrlKey && e.key.toLowerCase() === "m" && !e.shiftKey) {
    e.preventDefault();
    addMarker(timelineData.currentTime);
  } else if (e.ctrlKey && e.key.toLowerCase() === "c" && e.shiftKey) {
    e.preventDefault();
    executeCommand(clearMarkersCommand());
  } else if (e.key.toLowerCase() === "home") {
    e.preventDefault();
    toStartTime();
  } else if (e.key.toLowerCase() === "end") {
    e.preventDefault();
    toEndTime();
  } else if (!e.ctrlKey && e.key.toLowerCase() === "arrowright" && e.shiftKey) {
    e.preventDefault();
    frameForward();
  } else if (!e.ctrlKey && e.key.toLowerCase() === "arrowleft" && e.shiftKey) {
    e.preventDefault();
    frameBackward();
  } else if (e.ctrlKey && e.key.toLowerCase() === "=" && !e.shiftKey) {
    e.preventDefault();
    zoomIn();
  } else if (e.ctrlKey && e.key.toLowerCase() === "-" && !e.shiftKey) {
    e.preventDefault();
    zoomOut();
  } else if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if (
    e.ctrlKey &&
    ((e.key.toLowerCase() === "y" && !e.shiftKey) ||
      (e.key.toLowerCase() === "z" && e.shiftKey))
  ) {
    e.preventDefault();
    redo();
  }
};

export const setupKeyShortcuts = () => {
  document.addEventListener("keydown", keyboardHandler);
};

export const destroyKeyShortcuts = () => {
  document.removeEventListener("keydown", keyboardHandler);
};
let spaceDown = false;
const playPauseKeyUp = (e) => {
  if (e.code === "Space") {
    spaceDown = false;
  }
};
const playPauseKeyDown = (e) => {
  if (e.code !== "Space" || spaceDown || checkIgnoreElements()) return;

  spaceDown = true;
  e.preventDefault();
  togglePlayPause();
};
export const playPauseVideoKey = () => {
  document.addEventListener("keydown", playPauseKeyDown);
  document.addEventListener("keyup", playPauseKeyUp);
};

export const removePlayPauseVideoKey = () => {
  document.removeEventListener("keydown", playPauseKeyDown);
  document.removeEventListener("keyup", playPauseKeyUp);
};
