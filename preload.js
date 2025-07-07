const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ytDlp", {
  getVideoInfo: (url) => ipcRenderer.invoke("get-video-info", url),
  downloadVideo: (url, formatId, videoInfo) =>
    ipcRenderer.invoke("download-video", url, formatId, videoInfo),
});
