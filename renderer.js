const getInfoBtn = document.getElementById("get-info");
const videoUrlInput = document.getElementById("video-url");
const videoInfoDiv = document.getElementById("video-info");
const formatSelectors = document.getElementById("format-selectors");
const videoTypeSelect = document.getElementById("video-type");
const videoQualitySelect = document.getElementById("video-quality");
const audioQualitySelect = document.getElementById("audio-quality");
const downloadBtn = document.getElementById("download-btn");
const downloadStatus = document.getElementById("download-status");

let currentFormats = [];
let currentVideoInfo = null;

getInfoBtn.addEventListener("click", async () => {
  const url = videoUrlInput.value;
  if (url) {
    try {
      getInfoBtn.classList.add("loading");
      getInfoBtn.textContent = "Loading...";
      videoInfoDiv.innerHTML =
        '<div style="text-align: center;">Fetching video information...</div>';

      const videoInfo = await window.ytDlp.getVideoInfo(url);
      currentVideoInfo = videoInfo;

      const thumbnailUrl = videoInfo.thumbnail || "";
      const duration = videoInfo.duration
        ? formatDuration(videoInfo.duration)
        : "Unknown";

      videoInfoDiv.innerHTML = `
                <div class="video-details">
                    <div class="video-title">${
                      videoInfo.title || "Untitled"
                    }</div>
                    ${
                      thumbnailUrl
                        ? `<img src="${thumbnailUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;">`
                        : ""
                    }
                    <div style="margin-bottom: 10px;">Duration: ${duration}</div>
                </div>
            `;

      if (videoInfo.formats) {
        currentFormats = videoInfo.formats;
        populateFormatSelectors(videoInfo.formats);
        formatSelectors.style.display = "";
      } else {
        formatSelectors.style.display = "none";
      }
    } catch (error) {
      videoInfoDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
      getInfoBtn.classList.remove("loading");
      getInfoBtn.textContent = "Get Info";
    }
  }
});

function populateFormatSelectors(formats) {
  videoQualitySelect.innerHTML = "";
  audioQualitySelect.innerHTML = "";

  // Get best audio format
  const audioFormats = formats.filter(
    (f) => f.acodec !== "none" && f.vcodec === "none"
  );
  const bestAudioFormat = audioFormats.reduce((best, current) => {
    const currentBitrate = current.abr || 0;
    const bestBitrate = best ? best.abr || 0 : 0;
    return currentBitrate > bestBitrate ? current : best;
  }, null);

  // Video formats with both video and audio
  const videoWithAudioFormats = formats.filter(
    (f) => f.vcodec !== "none" && f.acodec !== "none"
  );

  // Video only formats (need to be merged with audio)
  const videoOnlyFormats = formats.filter(
    (f) => f.vcodec !== "none" && f.acodec === "none"
  );

  // Group formats by resolution and pick the best quality for each resolution
  const resolutionGroups = new Map();

  [...videoWithAudioFormats, ...videoOnlyFormats].forEach((format) => {
    const height = format.height || 0;
    const width = format.width || 0;
    const resolution = height ? `${width}x${height}` : "Unknown";
    const quality = format.quality || 0;

    if (
      !resolutionGroups.has(resolution) ||
      quality > resolutionGroups.get(resolution).quality
    ) {
      resolutionGroups.set(resolution, {
        ...format,
        needsAudio: format.acodec === "none",
      });
    }
  });

  // Sort resolutions by height (descending)
  const sortedFormats = Array.from(resolutionGroups.values()).sort(
    (a, b) => (b.height || 0) - (a.height || 0)
  );

  // Add options for video qualities
  sortedFormats.forEach((format) => {
    const height = format.height || 0;
    const fps = format.fps || 30;
    const filesize = format.filesize
      ? (format.filesize / 1024 / 1024).toFixed(1) + " MB"
      : "Unknown size";
    let quality =
      height >= 2160
        ? "4K"
        : height >= 1440
        ? "2K"
        : height >= 1080
        ? "Full HD"
        : height >= 720
        ? "HD"
        : "SD";

    let formatId = format.needsAudio
      ? `${format.format_id}+${bestAudioFormat.format_id}`
      : format.format_id;

    const label = `${quality} (${format.height}p${
      fps !== 30 ? ` ${fps}fps` : ""
    }) - ${format.ext.toUpperCase()} - ${filesize}`;

    const option = document.createElement("option");
    option.value = formatId;
    option.textContent = label;
    videoQualitySelect.appendChild(option);
  });

  // Audio only formats for audio-only mode
  audioFormats
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .forEach((format) => {
      const bitrate = format.abr ? `${format.abr}kbps` : "Unknown bitrate";
      const filesize = format.filesize
        ? (format.filesize / 1024 / 1024).toFixed(1) + " MB"
        : "Unknown size";
      const label = `${bitrate} ${format.ext.toUpperCase()} - ${filesize}`;

      const option = document.createElement("option");
      option.value = format.format_id;
      option.textContent = label;
      audioQualitySelect.appendChild(option);
    });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

downloadBtn.addEventListener("click", async () => {
  if (!currentVideoInfo) return;

  try {
    downloadBtn.classList.add("loading");
    downloadBtn.textContent = "Starting download...";
    downloadStatus.className = "";
    downloadStatus.textContent = "Preparing download...";

    const url = currentVideoInfo.webpage_url || videoUrlInput.value;
    const type = videoTypeSelect.value;
    let formatId =
      type === "video" ? videoQualitySelect.value : audioQualitySelect.value;

    // Handle combined format IDs (video+audio)
    if (formatId.includes("+")) {
      const [videoId, audioId] = formatId.split("+");
      formatId = `${videoId}+${audioId}`; // This tells yt-dlp to merge video and audio
    }

    const result = await window.ytDlp.downloadVideo(url, formatId);

    if (result.error) {
      downloadStatus.className = "error";
      downloadStatus.textContent = "Error: " + result.error;
    } else {
      downloadStatus.className = "success";
      downloadStatus.textContent = "Download completed successfully!";
    }
  } catch (error) {
    downloadStatus.className = "error";
    downloadStatus.textContent = "Error: " + error.message;
  } finally {
    downloadBtn.classList.remove("loading");
    downloadBtn.textContent = "Download";
  }
});

// Add video type change handler
videoTypeSelect.addEventListener("change", () => {
  const isVideo = videoTypeSelect.value === "video";
  document.querySelector('[for="video-quality"]').style.display = isVideo
    ? ""
    : "none";
  document.querySelector('[for="audio-quality"]').style.display = isVideo
    ? "none"
    : "";
  videoQualitySelect.style.display = isVideo ? "" : "none";
  audioQualitySelect.style.display = isVideo ? "none" : "";
});

// Trigger initial state
videoTypeSelect.dispatchEvent(new Event("change"));
