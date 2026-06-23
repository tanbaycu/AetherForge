/**
 * Module tải ảnh từ TikTok photo/slideshow posts
 * Sử dụng @tobyg74/tiktok-api-dl để trích xuất URL ảnh
 * và axios để tải ảnh về máy
 */

const { Downloader } = require("@tobyg74/tiktok-api-dl");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { printInfo, printWarning, printProgress } = require("./forge-logger");

/**
 * Tải ảnh từ TikTok photo post
 * @param {string} url - URL bài đăng TikTok
 * @param {string} outputDir - Thư mục lưu ảnh đầu ra
 * @returns {Promise<string[]>} - Danh sách đường dẫn ảnh đã tải
 */
async function downloadImages(url, outputDir) {
  printInfo("🔍 Đang phân tích URL TikTok...");

  // Tạo thư mục đầu ra nếu chưa tồn tại
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Lấy thông tin bài đăng từ TikTok API
  const result = await fetchTiktokData(url);

  if (!result || !result.imageUrls || result.imageUrls.length === 0) {
    throw new Error(
      "Không thể trích xuất ảnh từ URL này. Hãy đảm bảo đây là photo/slideshow post."
    );
  }

  printInfo(`📸 Tìm thấy ${result.imageUrls.length} ảnh trong bài đăng`);
  if (result.author) {
    printInfo(`👤 Tác giả: ${result.author}`);
  }
  if (result.description) {
    const desc =
      result.description.length > 80
        ? result.description.substring(0, 80) + "..."
        : result.description;
    printInfo(`📝 Mô tả: ${desc}`);
  }

  // Tải từng ảnh
  const downloadedPaths = [];
  for (let i = 0; i < result.imageUrls.length; i++) {
    const imageUrl = result.imageUrls[i];
    const ext = detectExtension(imageUrl);
    const fileName = `slide_${String(i + 1).padStart(3, "0")}${ext}`;
    const filePath = path.join(outputDir, fileName);

    printProgress(i + 1, result.imageUrls.length, fileName);

    try {
      await downloadFile(imageUrl, filePath);
      downloadedPaths.push(filePath);
    } catch (err) {
      printWarning(`⚠️ Không thể tải ảnh ${i + 1}: ${err.message}`);
    }
  }

  // Lưu metadata
  saveMetadata(outputDir, result, downloadedPaths);

  return downloadedPaths;
}

/**
 * Trích xuất dữ liệu ảnh từ TikTok bằng nhiều phương pháp
 * Thử lần lượt các API version khác nhau để đảm bảo tính ổn định
 */
async function fetchTiktokData(url) {
  // Danh sách các version API để thử lần lượt
  const versions = ["v3", "v1", "v2"];

  for (const version of versions) {
    try {
      printInfo(`📡 Thử API ${version}...`);
      const data = await Downloader(url, { version });

      if (data && data.status === "success" && data.result) {
        const result = data.result;

        // Kiểm tra xem có phải photo/slideshow post không
        if (result.type === "image" && result.images && result.images.length > 0) {
          printInfo(`✅ API ${version} thành công! Tìm thấy ${result.images.length} ảnh.`);
          return {
            imageUrls: result.images,
            description: result.desc || "",
            author: result.author?.nickname || result.author?.unique_id || "",
          };
        }

        // Một số version trả về ảnh ở dạng khác
        if (result.images && Array.isArray(result.images) && result.images.length > 0) {
          printInfo(`✅ API ${version} thành công! Tìm thấy ${result.images.length} ảnh.`);
          return {
            imageUrls: result.images,
            description: result.desc || result.description || "",
            author: result.author?.nickname || result.author?.unique_id || "",
          };
        }

        printWarning(`API ${version}: Post này không chứa ảnh slideshow.`);
      }
    } catch (err) {
      printWarning(`API ${version} thất bại: ${err.message}`);
    }
  }

  // Phương pháp dự phòng: Trích xuất trực tiếp từ trang web
  try {
    printInfo("📡 Phương pháp dự phòng: Trích xuất trực tiếp từ trang web...");
    return await extractFromWebPage(url);
  } catch (err) {
    printWarning(`Phương pháp dự phòng thất bại: ${err.message}`);
  }

  return null;
}

/**
 * Trích xuất ảnh trực tiếp từ trang web TikTok
 * Parse JSON data được nhúng trong trang HTML
 */
async function extractFromWebPage(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
    },
    timeout: 15000,
  });

  const html = response.data;

  // Tìm JSON data nhúng trong HTML (TikTok dùng nhiều dạng khác nhau)
  const patterns = [
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
    /<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/,
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  ];

  let jsonData = null;
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        jsonData = JSON.parse(match[1]);
        break;
      } catch (e) {
        continue;
      }
    }
  }

  if (!jsonData) {
    throw new Error("Không tìm thấy dữ liệu JSON trong trang web");
  }

  // Trích xuất URL ảnh từ các cấu trúc JSON khác nhau
  const imageUrls = extractImageUrlsFromJson(jsonData);

  if (imageUrls.length === 0) {
    throw new Error("Không tìm thấy URL ảnh trong dữ liệu JSON");
  }

  return {
    imageUrls,
    description: "",
    author: "",
  };
}

/**
 * Đệ quy tìm kiếm URL ảnh trong object JSON phức tạp
 * Hỗ trợ nhiều cấu trúc dữ liệu khác nhau của TikTok
 */
function extractImageUrlsFromJson(obj, depth = 0) {
  if (depth > 15) return [];

  const urls = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...extractImageUrlsFromJson(item, depth + 1));
    }
  } else if (obj && typeof obj === "object") {
    // Tìm image_post_info -> images -> imageURL -> urlList
    if (obj.image_post_info && obj.image_post_info.images) {
      for (const img of obj.image_post_info.images) {
        if (img.imageURL && img.imageURL.urlList) {
          urls.push(img.imageURL.urlList[0]);
        }
      }
      return urls;
    }

    // Tìm imagePost -> images
    if (obj.imagePost && obj.imagePost.images) {
      for (const img of obj.imagePost.images) {
        if (img.imageURL && img.imageURL.urlList) {
          urls.push(img.imageURL.urlList[0]);
        }
      }
      return urls;
    }

    // Đệ quy vào các thuộc tính con
    for (const key of Object.keys(obj)) {
      urls.push(...extractImageUrlsFromJson(obj[key], depth + 1));
    }
  }

  return urls;
}

/**
 * Tải file từ URL và lưu vào đường dẫn cục bộ
 * Sử dụng stream để xử lý file lớn hiệu quả
 */
async function downloadFile(url, outputPath) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.tiktok.com/",
    },
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/**
 * Phát hiện phần mở rộng file từ URL
 * Mặc định là .jpeg nếu không xác định được
 */
function detectExtension(url) {
  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    const ext = path.extname(urlPath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      return ext;
    }
  } catch {
    // URL có thể không parse được, bỏ qua
  }
  return ".jpeg";
}

/**
 * Lưu metadata của bài đăng vào file JSON
 * Giúp tra cứu thông tin sau này
 */
function saveMetadata(outputDir, data, downloadedPaths) {
  const metadata = {
    downloadedAt: new Date().toISOString(),
    description: data.description,
    author: data.author,
    totalImages: data.imageUrls.length,
    downloadedImages: downloadedPaths.length,
    files: downloadedPaths.map((p) => path.basename(p)),
  };

  fs.writeFileSync(
    path.join(outputDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );
}

module.exports = { downloadImages };
