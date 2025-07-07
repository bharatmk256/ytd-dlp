# YTD-GUI

A graphical user interface for yt-dlp, making video downloads easier.

## Prerequisites

### Installing yt-dlp

#### Windows

1. Install using pip:

```bash
pip install yt-dlp
```

Or download the executable from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases) and add it to your PATH.

#### Linux

```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

#### MacOS

```bash
brew install yt-dlp
```

Or using pip:

```bash
pip3 install yt-dlp
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ytd-gui.git
cd ytd-gui
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Application

Start the application by running:

```bash
npx electron .
```

## Features

- Easy to use graphical interface
- Download videos from youtube
- Select video quality
- Choose download location

## License

MIT License
