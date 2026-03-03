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
import shortcuts from "../../core/shortcuts.js";
import { matchShortcut } from "../../core/shortcutEngine.js";

const actions = {
  mute_unmute:{
    run: () => muteVolume(!timelineData.isMuted),
  },
  export:{
    run: () => exportTimeline(),
  },
  import:{
    run: () => importTimeline(),
    higher: true,
  },
  add_marker:{
    run: () => addMarker(timelineData.currentTime),
  },
  clear_markers:{
    run: () => executeCommand(clearMarkersCommand()),
  },
  undo: {
    run: () => undo(),
  },
  redo: {
    run: () => redo(),
  },
  zoom_in: {
    run: () => zoomIn(),
  },
  zoom_out: {
    run: () => zoomOut(),
  },
  frame_backward:{
    run: () => frameBackward(),
  },
  frame_forward:{
    run: () => frameForward(),
  },
  to_start:{
    run: () => toStartTime(),
  },
  to_end:{
    run: () => toEndTime(),
  }
};

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

const higherShortcuts = (e) => {  
  if (checkIgnoreElements()) return;
  for (const id in shortcuts) {
    if (matchShortcut(e, shortcuts[id])) {
      const action = actions[id];
      if (!action) break;
      if (!action.higher) break;
      e.preventDefault();
      action.run();
      break;
    }
  }
};
const keyboardHandler = (e) => {  
  if (checkIgnoreElements()) return;
  for (const id in shortcuts) {
    if (matchShortcut(e, shortcuts[id])) {
      const action = actions[id];
      if (!action) break;
      if (action.higher) break;
      e.preventDefault();
      action.run();
      break;
    }
  }
};

export const setupHigherShortcuts = () => document.addEventListener("keydown", higherShortcuts);
export const destroyHigherShortcuts = () => document.removeEventListener("keydown", higherShortcuts);

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
