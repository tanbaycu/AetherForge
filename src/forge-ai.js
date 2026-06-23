/**
 * Module nâng cao chất lượng ảnh
 * Sử dụng sharp để upscale, sharpen và cải thiện chất lượng ảnh
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { printInfo, printProgress, printWarning } = require("./forge-logger");

/**
 * Nâng cao chất lượng tất cả ảnh trong thư mục
 * - Upscale ảnh nhỏ lên kích thước tối thiểu
 * - Sharpen để ảnh nét hơn
 * - Tăng contrast nhẹ
 * - Xuất ra JPEG chất lượng cao (quality 95)
 *
 * @param {string[]} imagePaths - Danh sách đường dẫn ảnh
 * @param {object} options - Tùy chọn enhance
 * @param {number} options.minWidth - Chiều rộng tối thiểu (mặc định 2000px)
 * @param {number} options.quality - Chất lượng JPEG đầu ra (mặc định 95)
 * @param {boolean} options.overwrite - Ghi đè file gốc (mặc định true)
 * @returns {Promise<string[]>} - Danh sách đường dẫn ảnh đã enhance
 */
async function enhanceImages(imagePaths, options = {}) {
  const {
    minWidth = 2000,
    quality = 95,
    overwrite = true,
  } = options;

  printInfo(`🔧 Đang nâng cao chất lượng ${imagePaths.length} ảnh...`);
  printInfo(`   📐 Upscale tối thiểu: ${minWidth}px chiều rộng`);
  printInfo(`   🎨 Chất lượng JPEG: ${quality}%`);
  printInfo(`   ✨ Sharpen + tăng contrast`);

  const enhancedPaths = [];

  for (let i = 0; i < imagePaths.length; i++) {
    const imgPath = imagePaths[i];
    printProgress(i + 1, imagePaths.length, `Enhance ${path.basename(imgPath)}`);

    try {
      const enhanced = await enhanceSingleImage(imgPath, {
        minWidth,
        quality,
        overwrite,
      });
      enhancedPaths.push(enhanced);
    } catch (err) {
      printWarning(`⚠️ Không thể enhance ảnh ${i + 1}: ${err.message}`);
      enhancedPaths.push(imgPath); // Giữ ảnh gốc nếu lỗi
    }
  }

  return enhancedPaths;
}

/**
 * Nâng cao chất lượng 1 ảnh đơn lẻ
 * Pipeline: đọc → upscale → sharpen → tăng contrast → xuất JPEG chất lượng cao
 */
async function enhanceSingleImage(imgPath, options) {
  const { minWidth, quality, overwrite } = options;

  // Đọc file thành buffer để tránh sharp giữ lock file gây lỗi EBUSY
  const inputBuffer = fs.readFileSync(imgPath);

  // Đọc metadata ảnh gốc
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 1080;
  const originalHeight = metadata.height || 1080;

  // Tính kích thước mới nếu cần upscale
  let targetWidth = originalWidth;
  if (originalWidth < minWidth) {
    targetWidth = minWidth;
  }

  // Đường dẫn đầu ra - LUÔN LÀ .jpg VÌ PDFKIT KHÔNG HỖ TRỢ .webp
  const dir = path.dirname(imgPath);
  const ext = path.extname(imgPath);
  const base = path.basename(imgPath, ext);
  const finalExt = ".jpg";
  const outputPath = overwrite
    ? path.join(dir, `${base}${finalExt}`)
    : path.join(dir, `${base}_enhanced${finalExt}`);

  // Tạo file tạm để tránh conflict khi ghi đè
  const tempPath = path.join(dir, `${base}_temp_${Date.now()}${finalExt}`);

  // Pipeline xử lý ảnh
  await sharp(inputBuffer)
    // Upscale bằng lanczos3 (chất lượng cao nhất)
    .resize(targetWidth, null, {
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    // Sharpen - tăng độ nét
    .sharpen({ sigma: 1.0, m1: 1.0, m2: 2.0 })
    // Tăng contrast nhẹ bằng cách điều chỉnh gamma
    .gamma(1.1)
    // Điều chỉnh sáng/tương phản bằng linear transform nhẹ
    .linear(1.05, -5)
    // Xuất JPEG chất lượng cao
    .jpeg({
      quality: quality,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
    })
    .toFile(tempPath);

  // Nếu ghi đè, xóa file cũ (nếu có khác tên hoặc khác extension thì xóa)
  if (overwrite) {
    try {
      if (imgPath !== outputPath) {
        fs.unlinkSync(imgPath); // Xóa file .webp cũ
      } else {
        fs.unlinkSync(imgPath); // Xóa file cũ
      }
    } catch (e) {
      // Bỏ qua lỗi xóa file cũ
    }
    fs.renameSync(tempPath, outputPath);
    return outputPath;
  } else {
    // Rename file tạm thành tên đầu ra
    fs.renameSync(tempPath, outputPath);
    return outputPath;
  }
}

module.exports = { enhanceImages };
