export const getYouTubeTimestamp = (url) => {
  //  regex pattern for : https://youtu.be/VIDEO_ID?t=SECONDS
  const pattern = /^https:\/\/youtu\.be\/[\w-]+\?t=(\d+)$/;
  const match = url.match(pattern);

  if (match) {
    return match[1];
  }

  return null;
};

export const getYouTubeVideoId = (url) => {
  try {
    const urlObj = new URL(url);

    // youtube.com/watch
    if (
      urlObj.hostname.includes("youtube.com") &&
      urlObj.pathname === "/watch"
    ) {
      const vidId = urlObj.searchParams.get("v");
      if (vidId.length == 11) return vidId;
      return null;
    }

    // youtu.be or embed/shorts/live
    const pathMatch = urlObj.pathname.match(
      /\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})|^\/([a-zA-Z0-9_-]{11})$/
    );
    if (!pathMatch) return null;
    const vidId = pathMatch[2] || pathMatch[3];
    if (vidId.length == 11) return vidId;
    return null;
  } catch (e) {
    return null;
  }
};

export const getVideoTitle = (player) => {
  return player.playerInfo.videoData.title;
};
export const getVideoUrl = (player, vidId = null) => {
  const videoId = vidId ? vidId : player.playerInfo.videoData.video_id;
  const videoUrl = `https://wwww.youtube.com/watch?v=${videoId}`;
  return { videoId, videoUrl };
};
