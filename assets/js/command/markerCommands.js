import {
  markerData,
  updateMarker,
  createMarker,
  stopMarker,
  removeMarker,
  clearMarkers,
  restoreMarkers,
  MARKER,
} from "../markers.js";

export const AddMarkerCommand = (time) => {
  let marker = null;
  let index = null;

  return {
    execute() {
      marker = createMarker(time);
      index = markerData.list.length;
      markerData.list.push(marker);
      markerData.activeMarker = marker;
      updateMarker();
    },

    undo() {
      markerData.list.splice(index, 1);
      markerData.activeMarker = null;
      updateMarker();
    },
  };
};

export const CloseMarkerCommand = (time) => {
  let marker = null;
  let prevStartTime = null;
  let prevStopTime = null;

  return {
    execute() {
      marker = markerData.activeMarker;
      if (!marker) return false;
      prevStopTime = marker.endTime;
      prevStartTime = marker.startTime;
      if (!stopMarker(time)) return false;
      updateMarker();
    },

    undo() {
      marker.endTime = prevStopTime;
      marker.startTime = prevStartTime;
      markerData.activeMarker = marker;
      updateMarker();
    },
  };
};

export const removeMarkerCommand = (markerId) => {
  let removed = null;
  let index = null;

  return {
    execute() {
      const result = removeMarker(markerId);
      if (!result) return false;
      ({ index, removed } = result);
      updateMarker();
    },
    undo() {
      markerData.list.splice(index, 0, removed);
      index = null;
      removed = null;
      updateMarker();
    },
  };
};
export const clearMarkersCommand = () => {
  let removed = [];

  return {
    execute() {
      removed = clearMarkers();
      if (!removed) return false;
      updateMarker();
    },

    undo() {
      restoreMarkers(removed);
      updateMarker();
    },
  };
};

export const moveMarkerCommand = (dragContext) => {
  let marker = null;
  let toTime = null;

  const checkDrag = (context) => {
    let { markerId, type, fromTime } = context;
    const markerTarget = markerData.list.find((m) => m.id === markerId);

    toTime =
      type === MARKER.START ? markerTarget.startTime : markerTarget.endTime;

    if (fromTime === toTime) return false;

    return true;
  };

  if (!checkDrag(dragContext)) return;

  return {
    execute() {
      marker = markerData.list.find((m) => m.id === dragContext.markerId);
      if (!marker) return false;

      if (dragContext.type === MARKER.START) {
        marker.startTime = toTime;
      } else {
        marker.endTime = toTime;
      }

      updateMarker();
    },

    undo() {
      if (!marker) return false;
      if (dragContext.type === MARKER.START) {
        marker.startTime = dragContext.fromTime;
      } else {
        marker.endTime = dragContext.fromTime;
      }

      updateMarker();
    },
  };
};
