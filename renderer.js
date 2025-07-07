const getInfoBtn = document.getElementById('get-info');
const videoUrlInput = document.getElementById('video-url');
const videoInfoDiv = document.getElementById('video-info');
const formatSelectors = document.getElementById('format-selectors');
const videoTypeSelect = document.getElementById('video-type');
const videoQualitySelect = document.getElementById('video-quality');
const audioQualitySelect = document.getElementById('audio-quality');
const downloadBtn = document.getElementById('download-btn');
const downloadStatus = document.getElementById('download-status');

let currentFormats = [];
let currentVideoInfo = null;

getInfoBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value;
    if (url) {
        const videoInfo = await window.ytDlp.getVideoInfo(url);
        currentVideoInfo = videoInfo;
        videoInfoDiv.innerHTML = `<b>${videoInfo.title || ''}</b><br><pre>${JSON.stringify(videoInfo, null, 2)}</pre>`;
        if (videoInfo.formats) {
            currentFormats = videoInfo.formats;
            populateFormatSelectors(videoInfo.formats);
            formatSelectors.style.display = '';
        } else {
            formatSelectors.style.display = 'none';
        }
    }
});

function populateFormatSelectors(formats) {
    // Video qualities
    const videoFormats = formats.filter(f => f.vcodec !== 'none');
    videoQualitySelect.innerHTML = '';
    videoFormats.forEach(f => {
        const label = `${f.format_id} - ${f.format_note || f.resolution || ''} - ${f.ext}`;
        const option = document.createElement('option');
        option.value = f.format_id;
        option.textContent = label;
        videoQualitySelect.appendChild(option);
    });
    // Audio qualities
    const audioFormats = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    audioQualitySelect.innerHTML = '';
    audioFormats.forEach(f => {
        const label = `${f.format_id} - ${f.abr || ''}kbps - ${f.ext}`;
        const option = document.createElement('option');
        option.value = f.format_id;
        option.textContent = label;
        audioQualitySelect.appendChild(option);
    });
}

downloadBtn.addEventListener('click', async () => {
    if (!currentVideoInfo) return;
    const url = currentVideoInfo.webpage_url || videoUrlInput.value;
    const type = videoTypeSelect.value;
    let formatId = '';
    if (type === 'video') {
        formatId = videoQualitySelect.value;
    } else {
        formatId = audioQualitySelect.value;
    }
    downloadStatus.textContent = 'Starting download...';
    const result = await window.ytDlp.downloadVideo(url, formatId);
    if (result.error) {
        downloadStatus.textContent = 'Error: ' + result.error;
    } else {
        downloadStatus.textContent = 'Download finished!';
    }
});