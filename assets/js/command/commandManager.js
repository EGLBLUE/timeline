import { vidPlayer } from "../player.js";
import { setIsDirty } from "../states.js";

const undoStack = [];
const redoStack = [];
const MAX_STACK = 1000;
let savedIndex = 0;

const updateDirty = () => {
  if (vidPlayer) setIsDirty(undoStack.length !== savedIndex);
};

const checkCommand = (command, cmdType) => {
  if (
    !command ||
    typeof command !== "object" ||
    !Object.hasOwn(command, cmdType) ||
    typeof command.execute !== "function"
  )
    return false;
  return true;
};

export const resetStacks = () => {
  undoStack.length = 0;
  redoStack.length = 0;
  savedIndex = 0;
};

export const executeCommand = (command) => {
  if (!checkCommand(command, "execute")) return;
  if (command.execute?.() === false) return;

  undoStack.push(command);

  if (undoStack.length > MAX_STACK) {
    undoStack.shift();
    savedIndex = Math.max(0, savedIndex - 1);
  }

  redoStack.length = 0;
  updateDirty();
};

export const undo = () => {
  const command = undoStack.pop();
  if (!checkCommand(command, "undo")) return;
  if (command.undo?.() === false) return;

  redoStack.push(command);
  updateDirty();
};

export const redo = () => {
  const command = redoStack.pop();
  if (!checkCommand(command, "execute")) return;
  if (command.execute?.() === false) return;

  undoStack.push(command);
  updateDirty();
};

export const markSaved = () => {
  savedIndex = undoStack.length;
  updateDirty();
};

export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;
