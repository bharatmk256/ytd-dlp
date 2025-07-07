const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  // Import youtube-dl-exec
  const youtubeDl = require("youtube-dl-exec");

  // IPC handler to get video info
  ipcMain.handle("get-video-info", async (event, url) => {
    try {
      const videoInfo = await youtubeDl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });
      return videoInfo;
    } catch (error) {
      console.error("Error getting video info:", error);
      return { error: error.message };
    }
  });

  // IPC handler to download video
  const { dialog } = require("electron");
  const fs = require("fs");
  ipcMain.handle("download-video", async (event, url, formatId, videoInfo) => {
    try {
      // Determine file extension based on format type
      const isAudioOnly =
        !formatId.includes("+") &&
        videoInfo.formats.find((f) => f.format_id === formatId)?.vcodec ===
          "none";

      // Clean the video title to make it filesystem-safe
      const cleanTitle = (videoInfo.title || "video")
        .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filesystem characters
        .replace(/\s+/g, "_"); // Replace spaces with underscores

      // Set default extension based on format
      const defaultExt = isAudioOnly ? ".mp3" : ".mp4";

      // Ask user where to save the file
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Save Video",
        defaultPath: path.join(
          app.getPath("downloads"),
          cleanTitle + defaultExt
        ),
        filters: [
          {
            name: isAudioOnly ? "Audio Files" : "Video Files",
            extensions: isAudioOnly
              ? ["mp3", "m4a", "opus"]
              : ["mp4", "mkv", "webm"],
          },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (canceled || !filePath) return { error: "Save cancelled" };

      try {
        await youtubeDl(url, {
          format: formatId,
          output: filePath,
        });
        return { success: true };
      } catch (err) {
        return { error: err.message };
      }
    } catch (error) {
      console.error("Error downloading video:", error);
      return { error: error.message };
    }
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
