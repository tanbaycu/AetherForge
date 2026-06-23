<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/tanbaycu/tiktok-extractpr/main/docs/logo.png" alt="AetherForge" width="200">
  <br>
  AetherForge Extractor
  <br>
</h1>

<h4 align="center">Omni-Platform Social Scraper, AI Image Enhancer & PDF Forge Engine</h4>

<p align="center">
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/Node.js-18.x-green.svg?style=for-the-badge&logo=nodedotjs" alt="Node.js">
  </a>
  <a href="https://github.com/tanbaycu/tiktok-extractpr/releases">
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge" alt="Version">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge" alt="License">
  </a>
</p>

<p align="center">
  <a href="#about">About</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#license">License</a>
</p>

---

## 🌌 About

**AetherForge Extractor** is a god-tier CLI application designed to scrape, enhance, and compile digital documents from social media platforms. Built from the ground up for peak performance, it effortlessly extracts high-resolution images, runs them through an AI-powered enhancement pipeline, and compiles them into beautifully formatted, print-ready PDFs.

While architected as an **omni-platform** tool, AetherForge is highly optimized and works best with **Facebook Posts** and **TikTok Slideshows**.

## 🚀 Features

- 🌐 **Omni-Platform Scraping**: Extract ultra-high-quality, watermark-free image arrays from social media posts. Optimized specifically for TikTok Slideshows and Facebook Albums/Posts.
- 🧠 **Smart Snowflake Filtering**: Uses advanced Snowflake ID Proximity and heuristic algorithms to automatically filter out low-res thumbnails, ads, and irrelevant comment photos.
- 🪄 **AI Enhancement Pipeline**: Integrated `sharp` upscaling engine that automatically sharpens text readability, adjusts contrast, and upscales images up to 2000px width.
- 📄 **Flawless PDF Forge**: Perfect A4 geometrical scaling. Zero margins, zero distortion, zero cropped text. Transparently handles modern formats like `.webp` converting them flawlessly for PDF insertion.
- 💻 **Peak CLI Experience**: Built with raw TTY keyboard navigation, `cfonts` Chrome 3D branding, `boxen` layouts, `ora` spinners, and vibrant aurora gradient animations for an unmatched developer experience.

## 📦 Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then clone and set up the repository:

```bash
# Clone the repository
git clone https://github.com/tanbaycu/tiktok-extractpr.git

# Navigate into the directory
cd tiktok-extractpr

# Install dependencies
npm install
```

## ⚡ Usage

Launch the interactive CLI dashboard:

```bash
npm start
```
*Alternatively, you can run `node index.js` directly.*

### Interactive Navigation
- Use `↑` and `↓` arrow keys to navigate the stunning CLI menu.
- Press `Enter` to select an option (Full Pipeline, Download Only, Enhance, or PDF Export).
- Press `Esc` to quit the application safely.

## 🔬 How It Works

1. **Input**: Paste a URL from any supported platform (optimized for Facebook/TikTok).
2. **Scrape**: The engine bypasses restrictions, traverses the DOM/API, and pulls the maximum-resolution assets available from the CDN.
3. **Enhance**: A background task processes each image, sharpens text-heavy documents, and applies Lanczos3 upscaling.
4. **Compile**: A perfectly aligned A4 PDF is generated, ready for printing or archiving.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/tanbaycu/tiktok-extractpr/issues).

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <i>Forged for absolute peak performance and aesthetics by <a href="https://github.com/tanbaycu">@tanbaycu</a>.</i>
</p>
