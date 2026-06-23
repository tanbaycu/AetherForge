/**
 * Module tải ảnh từ Facebook posts
 * Chiến lược: Fetch HTML trực tiếp (axios) → parse scontent URLs từ JSON embedded
 * KHÔNG cần Puppeteer, KHÔNG cần đăng nhập
 * Chỉ hỗ trợ bài đăng công khai (public)
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { printInfo, printWarning, printProgress } = require("./forge-logger");

/**
 * Tải ảnh từ Facebook post
 * @param {string} url - URL bài đăng Facebook
 * @param {string} outputDir - Thư mục lưu ảnh
 * @returns {Promise<string[]>} - Danh sách đường dẫn ảnh đã tải
 */
async function downloadFacebookImages(url, outputDir) {
  printInfo("🔍 Đang phân tích URL Facebook...");

  // Tạo thư mục đầu ra
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Fetch HTML
  printInfo("📄 Đang tải trang Facebook...");
  const html = await fetchFacebookHTML(url);
  printInfo(`📦 Nhận được ${(html.length / 1024).toFixed(0)} KB dữ liệu`);

  // Trích xuất URL ảnh
  printInfo("🔎 Đang trích xuất URL ảnh...");
  const imageUrls = extractImageUrls(html);

  if (imageUrls.length === 0) {
    throw new Error(
      "Không tìm thấy ảnh trong bài đăng! Có thể bài không công khai."
    );
  }

  printInfo(`📸 Tìm thấy ${imageUrls.length} ảnh bài đăng`);

  // Tải từng ảnh
  const downloadedPaths = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const fileName = `slide_${String(i + 1).padStart(3, "0")}.jpg`;
    const filePath = path.join(outputDir, fileName);

    printProgress(i + 1, imageUrls.length, fileName);

    try {
      await downloadFile(imageUrl, filePath);
      downloadedPaths.push(filePath);
    } catch (err) {
      printWarning(`Không thể tải ảnh ${i + 1}: ${err.message}`);
    }
  }

  // Lưu metadata
  saveMetadata(outputDir, url, downloadedPaths);

  return downloadedPaths;
}

/**
 * Fetch HTML từ Facebook bằng axios
 */
async function fetchFacebookHTML(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      maxRedirects: 10,
      timeout: 20000,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Không thể truy cập Facebook: ${error.message}`);
  }
}

/**
 * Trích xuất URL ảnh từ HTML Facebook
 *
 * Facebook embed nhiều phiên bản cho cùng 1 ảnh:
 * - stp=cp6_dst-jpg_s590x590_tt6  → resize 590px (mờ!)
 * - stp=cp6_dst-jpg_tt6            → ảnh gốc, chỉ compress JPEG (TỐT NHẤT)
 * - stp=dst-jpg_fb30_s960x960_tt6  → ảnh từ comment/share
 * - stp=dst-jpg_p75x225_tt6        → ảnh thumbnail từ comment
 *
 * Chiến lược:
 * 1. Lấy tất cả scontent URLs từ HTML
 * 2. Lọc chỉ ảnh bài đăng (type -6, có stp=cp6)
 * 3. Deduplicate theo filename, ưu tiên version không resize
 */
function extractImageUrls(html) {
  const allUrls = new Set();

  // Pattern 1: URL escaped trong JSON
  const escapedPattern = /https:\\\/\\\/scontent[^"'\s}]+/g;
  let match;
  while ((match = escapedPattern.exec(html)) !== null) {
    allUrls.add(cleanUrl(match[0]));
  }

  // Pattern 2: URL không escaped (og:image, meta tags)
  const directPattern = /https:\/\/scontent[^"'\s>]+/g;
  while ((match = directPattern.exec(html)) !== null) {
    allUrls.add(cleanUrl(match[0]));
  }

  // ── BƯỚC 1: Lọc sơ bộ ──
  // Chỉ giữ ảnh type -6 (ảnh bài đăng lớn), có extension ảnh
  const type6Images = [...allUrls].filter((url) => {
    if (!/\.(jpg|jpeg|png|webp)/i.test(url)) return false;
    if (!/-6\//.test(url)) return false;
    if (url.includes("emoji") || url.includes("rsrc.php")) return false;
    return true;
  });

  // ── BƯỚC 2: Group theo filename ──
  // Mỗi ảnh có nhiều versions (kích thước khác nhau)
  const imagesByFile = new Map();
  for (const url of type6Images) {
    const fileMatch = url.match(/\/([^/?]+\.(?:jpg|jpeg|png|webp))/i);
    if (!fileMatch) continue;
    const filename = fileMatch[1];

    if (!imagesByFile.has(filename)) {
      imagesByFile.set(filename, []);
    }
    imagesByFile.get(filename).push(url);
  }

  // ── BƯỚC 3: Lọc ảnh bài đăng, bỏ ảnh comment ──
  // Ảnh bài đăng: stp chứa "cp" (crop position) — cp0, cp6, etc.
  // Ảnh comment/share: stp chứa "fb30" hoặc "p75x225" (thumbnail nhỏ)
  // Lấy Post ID để làm căn cứ lọc (ID của post và ảnh thường rất sát nhau)
  let postId = null;
  const postIdMatch = html.match(/"post_id":"(\d+)"/) || html.match(/canonical"[^>]*href="[^"]+\/(\d{10,})\/?(?:["?])/);
  if (postIdMatch) {
    try { postId = BigInt(postIdMatch[1]); } catch(e) {}
  }

  const postImageFiles = new Map();

  for (const [filename, urls] of imagesByFile) {
    // Ưu tiên 1: Kiểm tra có version nào chứa "cp" trong stp không
    const hasPostVersion = urls.some((u) => {
      const stp = u.match(/stp=([^&]+)/)?.[1] || "";
      return /cp\d/.test(stp);
    });

    if (hasPostVersion) {
      postImageFiles.set(filename, urls);
    }
  }

  // Ưu tiên 2: Dùng khoảng cách giữa Media ID và Post ID (Snowflake proximity)
  // Nếu cách 1 thất bại (không có ảnh nào chứa cp)
  if (postImageFiles.size === 0 && postId) {
    for (const [filename, urls] of imagesByFile) {
      const parts = filename.split('_');
      if (parts.length > 1) {
        try {
          const mediaId = BigInt(parts[1]);
          const diff = mediaId > postId ? mediaId - postId : postId - mediaId;
          // Ngưỡng 2 tỷ (khoảng vài giờ đồng hồ chênh lệch Snowflake ID)
          if (diff < BigInt(2000000000)) {
            postImageFiles.set(filename, urls);
          }
        } catch(e) {}
      }
    }
  }

  // Fallback cuối cùng: Bỏ thumbnail nhỏ
  if (postImageFiles.size === 0) {
    for (const [filename, urls] of imagesByFile) {
      const hasTinyThumb = urls.every((u) => {
        const stp = u.match(/stp=([^&]+)/)?.[1] || "";
        return /p\d+x\d+/.test(stp) && !/s\d{3,}x\d{3,}/.test(stp);
      });
      if (!hasTinyThumb) {
        postImageFiles.set(filename, urls);
      }
    }
  }

  // ── BƯỚC 4: Chọn version chất lượng cao nhất cho mỗi ảnh ──
  const bestUrls = [];
  for (const [filename, urls] of postImageFiles) {
    const best = selectBestQuality(urls);
    bestUrls.push(best);
  }

  return bestUrls;
}

/**
 * Chọn URL chất lượng cao nhất từ danh sách versions
 *
 * Thứ tự ưu tiên (cao → thấp):
 * 1. stp=cp*_dst-jpg_tt6        → ảnh gốc, chỉ JPEG compress (TỐT NHẤT)
 * 2. stp=dst-jpg_tt6            → ảnh gốc không crop
 * 3. Không có stp=              → có thể full-res
 * 4. stp=cp*_dst-jpg_s960x960   → resize 960px
 * 5. stp=cp*_dst-jpg_s590x590   → resize 590px (MỜ)
 * 6. Các version khác            → ưu tiên URL dài nhất
 */
function selectBestQuality(urls) {
  let best = urls[0];
  let bestScore = -1;

  for (const url of urls) {
    const stp = url.match(/stp=([^&]+)/)?.[1] || "";
    let score = 0;

    // 1. Phân tích kích thước từ ctp= hoặc cstp= (vd: ctp=s1212x1686, cstp=mx1212x1686)
    let area = 0;
    const ctpMatch = url.match(/[c]?tp=[ms]?(\d+)x(\d+)/);
    if (ctpMatch) {
      area = parseInt(ctpMatch[1]) * parseInt(ctpMatch[2]);
    }
    
    // Cộng điểm dựa trên diện tích ảnh (chia cho 10000 để làm điểm số)
    score += (area / 10000);

    // 2. Cộng điểm ưu tiên cho loại stp
    if (/cp\d+_dst-jpg_tt6$/.test(stp)) {
      // cp*_dst-jpg_tt6 = ảnh gốc crop, không resize
      score += 10000;
    } else if (/dst-jpg_tt6$/.test(stp) && !/_s\d+x\d+/.test(stp)) {
      // dst-jpg_tt6 không resize
      score += 9000;
    } else if (!stp) {
      // Không stp = có thể full-res
      score += 8500;
    } else if (/_s2048x2048/.test(stp)) {
      score += 8000;
    } else if (/_s1200x1200/.test(stp)) {
      score += 7000;
    } else if (/_s960x960/.test(stp)) {
      score += 6000;
    } else if (/_s720x720/.test(stp)) {
      score += 5000;
    } else if (/_s590x590/.test(stp)) {
      score += 4000;
    } else if (/_p\d+x\d+/.test(stp)) {
      score += 3000;
    } else {
      score += 2000;
    }

    if (score > bestScore) {
      best = url;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Clean URL: unescape JSON slash, decode HTML entities
 */
function cleanUrl(url) {
  return url
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/\\u0025/g, "%");
}

// ═══════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════

async function downloadFile(url, outputPath) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.facebook.com/",
    },
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function saveMetadata(outputDir, url, downloadedPaths) {
  const metadata = {
    downloadedAt: new Date().toISOString(),
    source: "facebook",
    url,
    description: "",
    author: "",
    totalImages: downloadedPaths.length,
    downloadedImages: downloadedPaths.length,
    files: downloadedPaths.map((p) => path.basename(p)),
  };

  fs.writeFileSync(
    path.join(outputDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );
}

module.exports = { downloadFacebookImages };
