#!/usr/bin/env node

/**
 * Photo Extractor CLI - Premium Interactive Mode
 * Hỗ trợ tải ảnh từ TikTok + Facebook
 * Giao diện CLI custom build, gradient animation, keyboard-driven
 * Chạy: node index.js
 */

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const {
  showAnimatedBanner,
  showStaticBanner,
  showMenu,
  promptInput,
  promptConfirm,
  promptNumber,
  showStepHeader,
  createSpinner,
  showSummaryBox,
  showHistoryCard,
  showGoodbye,
} = require("./src/forge-ui");
const { downloadImages } = require("./src/forge-tiktok");
const { downloadFacebookImages } = require("./src/forge-facebook");
const { exportToPDF } = require("./src/forge-pdf");
const { enhanceImages } = require("./src/forge-ai");

// ═══════════════════════════════════════════════════
// Cấu hình mặc định
// ═══════════════════════════════════════════════════
const DEFAULT_OUTPUT_TIKTOK = "./tiktok-images";
const DEFAULT_OUTPUT_FB = "./facebook-images";
const DEFAULT_PDF_NAME = "photos.pdf";
const DEFAULT_MIN_WIDTH = 2000;
const DEFAULT_QUALITY = 95;

// ═══════════════════════════════════════════════════
// Hàm nhận diện platform từ URL
// ═══════════════════════════════════════════════════

/**
 * Tự động nhận diện nguồn (TikTok hay Facebook) từ URL
 * @returns {'tiktok' | 'facebook' | null}
 */
function detectPlatform(url) {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/facebook\.com|fb\.com|fb\.watch/i.test(url)) return "facebook";
  return null;
}

/** Validate URL (hỗ trợ cả TikTok và Facebook) */
function validateUrl(url) {
  if (!url) return "Vui lòng nhập URL!";
  const platform = detectPlatform(url);
  if (!platform) {
    return "URL không hợp lệ! Hỗ trợ: TikTok, Facebook";
  }
  return true;
}

/** Lấy thư mục mặc định theo platform */
function getDefaultOutput(platform) {
  return platform === "facebook" ? DEFAULT_OUTPUT_FB : DEFAULT_OUTPUT_TIKTOK;
}

/** Lấy icon theo platform */
function getPlatformIcon(platform) {
  return platform === "facebook" ? "📘" : "🎵";
}

/** Lấy tên platform */
function getPlatformName(platform) {
  return platform === "facebook" ? "Facebook" : "TikTok";
}

// ═══════════════════════════════════════════════════
// Hàm tải ảnh chung - tự dispatch theo platform
// ═══════════════════════════════════════════════════
async function smartDownload(url, outputDir) {
  const platform = detectPlatform(url);
  if (platform === "facebook") {
    return await downloadFacebookImages(url, outputDir);
  }
  return await downloadImages(url, outputDir);
}

// ═══════════════════════════════════════════════════
// Main - Vòng lặp chương trình
// ═══════════════════════════════════════════════════
async function main() {
  // Banner animated lần đầu
  await showAnimatedBanner();

  let running = true;

  while (running) {
    // Menu chính
    const action = await showMenu("MENU CHÍNH", [
      {
        icon: "⚡",
        label: "Full Pipeline",
        desc: "Tải → Enhance → PDF",
        value: "full_pipeline",
      },
      "separator",
      {
        icon: "📥",
        label: "Tải ảnh",
        desc: "TikTok / Facebook",
        value: "download",
      },
      {
        icon: "✨",
        label: "Enhance",
        desc: "Tăng nét + upscale",
        value: "enhance",
      },
      {
        icon: "📄",
        label: "Xuất PDF",
        desc: "A4 full-page",
        value: "pdf",
      },
      "separator",
      {
        icon: "📂",
        label: "Lịch sử",
        desc: "Xem các lần tải trước",
        value: "history",
      },
      {
        icon: "🚪",
        label: "Thoát",
        desc: "Esc",
        value: "exit",
      },
    ]);

    if (action === "__exit__" || action === "exit") {
      running = false;
      continue;
    }

    // Xử lý từng action
    switch (action) {
      case "full_pipeline":
        await handleFullPipeline();
        break;
      case "download":
        await handleDownload();
        break;
      case "enhance":
        await handleEnhance();
        break;
      case "pdf":
        await handlePDF();
        break;
      case "history":
        await handleHistory();
        break;
    }

    // Chờ quay lại menu
    console.log();
    await waitForContinue();
    showStaticBanner();
  }

  await showGoodbye();
  process.exit(0);
}

// ═══════════════════════════════════════════════════
// Handler: Full Pipeline (TikTok + Facebook)
// ═══════════════════════════════════════════════════
async function handleFullPipeline() {
  console.log();

  // 1. Nhập URL - tự nhận diện platform
  const url = await promptInput(
    "Dán URL (Hỗ trợ tốt nhất TikTok & Facebook)",
    "https://www.tiktok.com/... hoặc https://www.facebook.com/...",
    validateUrl
  );
  if (!url) return;

  const platform = detectPlatform(url);
  console.log(
    chalk.hex("#4DA9FF")(
      `  ${getPlatformIcon(platform)} Nhận diện: ${getPlatformName(platform)}`
    )
  );

  // 2. Thư mục đầu ra
  const defaultDir = getDefaultOutput(platform);
  const outputDir = await promptInput("Thư mục lưu ảnh", defaultDir);
  const resolvedDir = path.resolve(outputDir || defaultDir);

  // 3. Cấu hình enhance
  const doEnhance = await promptConfirm("Enhance ảnh (tăng nét)?");
  if (doEnhance === "__exit__") return;

  let minWidth = DEFAULT_MIN_WIDTH;
  let quality = DEFAULT_QUALITY;
  if (doEnhance) {
    minWidth = await promptNumber(
      "Chiều rộng tối thiểu (px)",
      DEFAULT_MIN_WIDTH
    );
    quality = await promptNumber("Chất lượng JPEG (1-100)", DEFAULT_QUALITY);
  }

  // 4. Cấu hình PDF
  const doPdf = await promptConfirm("Xuất PDF?");
  if (doPdf === "__exit__") return;

  let pdfName = DEFAULT_PDF_NAME;
  if (doPdf) {
    const name = await promptPdfName();
    if (!name) return;
    pdfName = name;
  }

  // ── BẮT ĐẦU PIPELINE ──
  const totalSteps = 1 + (doEnhance ? 1 : 0) + (doPdf ? 1 : 0);
  let currentStep = 0;

  // Step 1: Tải ảnh
  currentStep++;
  showStepHeader(
    currentStep,
    totalSteps,
    `Đang tải ảnh từ ${getPlatformName(platform)}...`
  );
  const spinnerDl = createSpinner(
    `Đang kết nối ${getPlatformName(platform)}...`
  ).start();

  let images;
  try {
    images = await smartDownload(url, resolvedDir);
    spinnerDl.succeed(`Tải thành công ${images.length} ảnh`);
  } catch (error) {
    spinnerDl.fail(`Lỗi: ${error.message}`);
    return;
  }

  // Step 2: Enhance
  if (doEnhance) {
    currentStep++;
    showStepHeader(currentStep, totalSteps, "Đang enhance ảnh...");
    const spinnerEn = createSpinner(
      "Upscale + sharpen + optimize..."
    ).start();

    try {
      images = await enhanceImages(images, {
        minWidth,
        quality,
        overwrite: true,
      });
      spinnerEn.succeed(`Enhance ${images.length} ảnh xong`);
    } catch (error) {
      spinnerEn.warn(`Enhance lỗi: ${error.message}`);
    }
  }

  // Step 3: PDF
  if (doPdf) {
    currentStep++;
    showStepHeader(currentStep, totalSteps, "Đang xuất PDF...");
    const pdfPath = path.join(resolvedDir, pdfName);
    const spinnerPdf = createSpinner("Rendering pages...").start();

    try {
      await exportToPDF(images, pdfPath);
      const sizeMB = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(2);
      spinnerPdf.succeed(`PDF đã lưu (${sizeMB} MB)`);
    } catch (error) {
      spinnerPdf.fail(`Lỗi PDF: ${error.message}`);
    }
  }

  // Summary
  const summaryItems = [
    ["Nguồn", `${getPlatformIcon(platform)} ${getPlatformName(platform)}`],
    ["Số ảnh", `${images.length} slides`],
    ["Thư mục", resolvedDir],
    ["Enhance", doEnhance ? `${minWidth}px / ${quality}%` : "Không"],
  ];
  if (doPdf) {
    summaryItems.push(["PDF", pdfName]);
  }
  showSummaryBox(summaryItems);
}

// ═══════════════════════════════════════════════════
// Handler: Tải ảnh
// ═══════════════════════════════════════════════════
async function handleDownload() {
  console.log();

  const url = await promptInput(
    "Dán URL (Hỗ trợ tốt nhất TikTok & Facebook)",
    "Dán link bài đăng có ảnh...",
    validateUrl
  );
  if (!url) return;

  const platform = detectPlatform(url);
  console.log(
    chalk.hex("#4DA9FF")(
      `  ${getPlatformIcon(platform)} Nhận diện: ${getPlatformName(platform)}`
    )
  );

  const defaultDir = getDefaultOutput(platform);
  const outputDir = await promptInput("Thư mục lưu ảnh", defaultDir);
  const resolvedDir = path.resolve(outputDir || defaultDir);

  const spinner = createSpinner(
    `Đang tải ảnh từ ${getPlatformName(platform)}...`
  ).start();

  try {
    const images = await smartDownload(url, resolvedDir);
    spinner.succeed(`Tải thành công ${images.length} ảnh`);
    showSummaryBox([
      ["Nguồn", `${getPlatformIcon(platform)} ${getPlatformName(platform)}`],
      ["Số ảnh", `${images.length} slides`],
      ["Thư mục", resolvedDir],
    ]);
  } catch (error) {
    spinner.fail(`Lỗi: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════
// Handler: Enhance
// ═══════════════════════════════════════════════════
async function handleEnhance() {
  console.log();

  const inputDir = await selectImageDir();
  if (!inputDir) return;

  const imageFiles = getImageFiles(inputDir);
  if (imageFiles.length === 0) {
    console.log(chalk.red("  ✗ Không tìm thấy ảnh nào!"));
    return;
  }

  console.log(
    chalk.hex("#4DA9FF")(`  ℹ Tìm thấy ${imageFiles.length} ảnh`)
  );

  const minWidth = await promptNumber(
    "Chiều rộng tối thiểu (px)",
    DEFAULT_MIN_WIDTH
  );
  const quality = await promptNumber(
    "Chất lượng JPEG (1-100)",
    DEFAULT_QUALITY
  );

  const spinner = createSpinner("Đang enhance ảnh...").start();

  try {
    await enhanceImages(imageFiles, { minWidth, quality, overwrite: true });
    spinner.succeed(`Enhance ${imageFiles.length} ảnh thành công`);
  } catch (error) {
    spinner.fail(`Lỗi: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════
// Handler: Xuất PDF
// ═══════════════════════════════════════════════════
async function handlePDF() {
  console.log();

  const inputDir = await selectImageDir();
  if (!inputDir) return;

  const imageFiles = getImageFiles(inputDir);
  if (imageFiles.length === 0) {
    console.log(chalk.red("  ✗ Không tìm thấy ảnh nào!"));
    return;
  }

  console.log(
    chalk.hex("#4DA9FF")(`  ℹ Tìm thấy ${imageFiles.length} ảnh`)
  );

  const pdfName = await promptPdfName();
  if (!pdfName) return;
  const pdfPath = path.join(inputDir, pdfName);

  const spinner = createSpinner("Đang xuất PDF...").start();

  try {
    await exportToPDF(imageFiles, pdfPath);
    const sizeMB = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(2);
    spinner.succeed(`PDF đã lưu (${sizeMB} MB)`);
    showSummaryBox([
      ["Số ảnh", `${imageFiles.length} slides`],
      ["File PDF", pdfPath],
      ["Kích thước", `${sizeMB} MB`],
    ]);
  } catch (error) {
    spinner.fail(`Lỗi: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════
// Handler: Lịch sử
// ═══════════════════════════════════════════════════
async function handleHistory() {
  console.log();

  const cwd = process.cwd();
  const dirs = fs.readdirSync(cwd).filter((f) => {
    const fullPath = path.join(cwd, f);
    return (
      fs.statSync(fullPath).isDirectory() &&
      fs.existsSync(path.join(fullPath, "metadata.json"))
    );
  });

  if (dirs.length === 0) {
    console.log(chalk.hex("#888")("  Chưa có lịch sử tải nào."));
    return;
  }

  for (const dir of dirs) {
    try {
      const metaPath = path.join(cwd, dir, "metadata.json");
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const date = new Date(meta.downloadedAt).toLocaleString("vi-VN");
      const pdfs = fs
        .readdirSync(path.join(cwd, dir))
        .filter((f) => f.endsWith(".pdf"))
        .join(", ");

      // Hiển thị nguồn (TikTok/Facebook)
      const source = meta.source || "tiktok";
      const sourceIcon = source === "facebook" ? "📘" : "🎵";

      showHistoryCard({
        dir: `${sourceIcon} ${dir}`,
        date,
        author: meta.author || "Không rõ",
        imgCount: meta.downloadedImages || 0,
        pdfs: pdfs || null,
      });
      console.log();
    } catch {
      // Bỏ qua
    }
  }
}

// ═══════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════

/** Chọn thư mục chứa ảnh từ danh sách có sẵn */
async function selectImageDir() {
  const cwd = process.cwd();
  const dirs = fs.readdirSync(cwd).filter((f) => {
    const fullPath = path.join(cwd, f);
    if (!fs.statSync(fullPath).isDirectory()) return false;
    return fs
      .readdirSync(fullPath)
      .some((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
  });

  if (dirs.length === 0) {
    console.log(chalk.red("  ✗ Không tìm thấy thư mục nào chứa ảnh!"));
    return null;
  }

  if (dirs.length === 1) {
    const dir = path.join(cwd, dirs[0]);
    const count = getImageFiles(dir).length;
    console.log(
      chalk.hex("#888")(`  Tự động chọn: ${dirs[0]} (${count} ảnh)`)
    );
    return dir;
  }

  // Nhiều thư mục → cho chọn
  const items = dirs.map((d) => {
    const count = getImageFiles(path.join(cwd, d)).length;
    return {
      icon: "📁",
      label: d,
      desc: `${count} ảnh`,
      value: path.join(cwd, d),
    };
  });

  return await showMenu("Chọn thư mục", items);
}

/** Lấy danh sách ảnh đã sắp xếp */
function getImageFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    })
    .map((f) => path.join(dir, f));
}

/** Tự động thêm đuôi .pdf nếu user không nhập */
function ensurePdfExtension(name) {
  if (!name) return DEFAULT_PDF_NAME;
  if (name.toLowerCase().endsWith(".pdf")) return name;
  return name + ".pdf";
}

/** Vòng lặp xác thực tên file PDF để tránh nhấn nhầm Enter */
async function promptPdfName() {
  while (true) {
    const inputName = await promptInput("Tên file PDF", "Vui lòng nhập tên file (bắt buộc)");
    
    if (!inputName || !inputName.trim()) {
      console.log(chalk.yellow("  ⚠️ CẢNH BÁO: Bạn vừa bỏ trống tên file!"));
      const useDefault = await promptConfirm(`Bạn có muốn dùng tên mặc định là "${DEFAULT_PDF_NAME}" không?`, false);
      if (useDefault === "__exit__") return null;
      if (useDefault) return DEFAULT_PDF_NAME;
      // Nếu chọn No, vòng lặp sẽ chạy lại để nhập tên mới
    } else {
      const finalName = ensurePdfExtension(inputName.trim());
      const isConfirmed = await promptConfirm(`Xác nhận lưu file PDF với tên "${finalName}"?`, true);
      if (isConfirmed === "__exit__") return null;
      if (isConfirmed) return finalName;
      // Nếu chọn No, cho phép nhập lại
    }
  }
}

/** Chờ nhấn Enter để tiếp tục */
function waitForContinue() {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      chalk.hex("#555")("  ↩  Nhấn Enter để quay lại menu..."),
      () => {
        rl.close();
        resolve();
      }
    );
  });
}

// ═══════════════════════════════════════════════════
// Khởi chạy + xử lý Ctrl+C
// ═══════════════════════════════════════════════════
process.on("SIGINT", () => {
  console.log(chalk.cyan("\n\n  👋 Tạm biệt!\n"));
  process.exit(0);
});

main().catch((err) => {
  if (err.message?.includes("closed")) {
    console.log(chalk.cyan("\n  👋 Tạm biệt!\n"));
  } else {
    console.error(chalk.red(`\n  ❌ Lỗi: ${err.message}\n`));
  }
  process.exit(0);
});
