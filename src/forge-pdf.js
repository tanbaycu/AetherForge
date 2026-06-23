/**
 * Module xuất ảnh thành file PDF
 * Sử dụng PDFKit để tạo PDF chất lượng cao
 * Ảnh được sắp xếp theo thứ tự, mỗi ảnh chiếm 1 trang A4
 * KHÔNG CÓ MARGIN - ảnh phủ kín trang
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");
const { printInfo, printProgress } = require("./forge-logger");

// Kích thước chuẩn A4 tính theo points (72 points = 1 inch)
const A4_WIDTH = 595.28; // 210mm
const A4_HEIGHT = 841.89; // 297mm

/**
 * Xuất danh sách ảnh thành file PDF chuẩn A4
 * Mỗi ảnh chiếm 1 trang, KHÔNG margin, ảnh được scale fill kín trang
 * @param {string[]} imagePaths - Danh sách đường dẫn file ảnh
 * @param {string} outputPath - Đường dẫn file PDF đầu ra
 */
async function exportToPDF(imagePaths, outputPath) {
  printInfo(`📄 Đang tạo PDF chuẩn A4 (không margin) với ${imagePaths.length} ảnh...`);

  // Đảm bảo thư mục đầu ra tồn tại
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Lọc chỉ giữ các file ảnh hợp lệ
  const validImages = imagePaths.filter((imgPath) => {
    if (!fs.existsSync(imgPath)) return false;
    try {
      return fs.statSync(imgPath).size > 0;
    } catch {
      return false;
    }
  });

  if (validImages.length === 0) {
    throw new Error("Không có ảnh hợp lệ nào để xuất PDF!");
  }

  return new Promise((resolve, reject) => {
    (async () => {
      // Tạo document PDF chuẩn A4, KHÔNG có margin
      const doc = new PDFDocument({
        autoFirstPage: false,
        compress: true,
        info: {
          Title: "TikTok Photo Collection",
          Author: "TikTok Photo Extractor CLI",
          Creator: "tiktok-extractpr",
          CreationDate: new Date(),
        },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      for (let i = 0; i < validImages.length; i++) {
        const imgPath = validImages[i];
        printProgress(i + 1, validImages.length, `Thêm ảnh ${i + 1} vào PDF`);

        try {
          // Nếu file là .webp, pdfkit không hỗ trợ, phải convert sang .jpg tạm thời
          let finalImgPath = imgPath;
          let isTemp = false;
          
          if (imgPath.toLowerCase().endsWith(".webp")) {
            finalImgPath = path.join(path.dirname(imgPath), `_pdf_temp_${Date.now()}_${i}.jpg`);
            try {
               // Require sharp dynamically, we know it's installed
               const sharp = require("sharp");
               await sharp(imgPath).jpeg().toFile(finalImgPath);
               isTemp = true;
            } catch (convertErr) {
               throw new Error("Không thể chuyển đổi WebP sang JPEG cho PDF: " + convertErr.message);
            }
          }

          // Đọc kích thước ảnh gốc
          let imgWidth, imgHeight;
          try {
            const dimensions = sizeOf(finalImgPath);
            imgWidth = dimensions.width;
            imgHeight = dimensions.height;
          } catch {
            imgWidth = 1080;
            imgHeight = 1920;
          }

          // Thêm trang A4 mới - margin = 0
          doc.addPage({
            size: "A4",
            margin: 0,
          });

          doc.image(finalImgPath, 0, 0, {
            fit: [A4_WIDTH, A4_HEIGHT],
            align: 'center',
            valign: 'top'
          });

          // Xóa file tạm nếu có
          if (isTemp) {
            try { fs.unlinkSync(finalImgPath); } catch (e) {}
          }
        } catch (err) {
          printInfo(`⚠️ Bỏ qua ảnh ${i + 1}: ${err.message}`);
        }
      }

      doc.end();

      stream.on("finish", () => {
        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        printInfo(`📊 Kích thước PDF: ${sizeMB} MB`);
        resolve(outputPath);
      });

      stream.on("error", reject);
    })().catch(reject);
  });
}

module.exports = { exportToPDF };
