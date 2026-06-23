<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/tanbaycu/AetherForge/main/docs/logo.png" alt="AetherForge" width="200">
  <br>
  AetherForge Extractor
  <br>
</h1>

<h4 align="center">Công cụ cào dữ liệu Omni-Platform, Nâng cấp ảnh bằng AI & Chế bản PDF siêu việt</h4>

<p align="center">
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/Node.js-18.x-green.svg?style=for-the-badge&logo=nodedotjs" alt="Node.js">
  </a>
  <a href="https://github.com/tanbaycu/AetherForge/releases">
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge" alt="Version">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge" alt="License">
  </a>
</p>

<p align="center">
  <a href="#giới-thiệu">Giới thiệu</a> •
  <a href="#tính-năng">Tính năng</a> •
  <a href="#cài-đặt">Cài đặt</a> •
  <a href="#sử-dụng">Sử dụng</a> •
  <a href="#hình-ảnh-demo">Hình ảnh Demo</a> •
  <a href="#đóng-góp">Đóng góp</a> •
  <a href="#bản-quyền">Bản quyền</a>
</p>

---

## 🌌 Giới thiệu

**AetherForge Extractor** là một ứng dụng CLI thần thánh (God-tier) được thiết kế để cào (scrape), nâng cao chất lượng và biên dịch các tài liệu kỹ thuật số từ các nền tảng mạng xã hội. Được xây dựng từ đầu để đạt hiệu suất tối đa (peak performance), công cụ này dễ dàng trích xuất hình ảnh độ phân giải cao, đưa chúng qua một luồng xử lý AI để tăng độ nét, và đóng gói thành một file PDF chuẩn A4 siêu đẹp, sẵn sàng để in ấn.

Mặc dù được kiến trúc theo hướng **đa nền tảng (omni-platform)**, AetherForge hiện đang được tối ưu hóa tối đa và hoạt động đỉnh nhất trên **Facebook Posts** và **TikTok Slideshows**.

## 🚀 Tính năng nổi bật

- 🌐 **Omni-Platform Scraping**: Trích xuất hàng loạt hình ảnh chất lượng cao, không dính watermark từ các bài đăng mạng xã hội. Tối ưu đặc biệt cho TikTok Slideshows và Facebook Albums/Posts.
- 🧠 **Smart Snowflake Filtering**: Sử dụng thuật toán tiệm cận Snowflake ID tiên tiến để tự động lọc bỏ các ảnh thumbnail độ phân giải thấp, quảng cáo và ảnh rác trong phần bình luận.
- 🪄 **AI Enhancement Pipeline**: Tích hợp engine upscaling `sharp` giúp tự động làm nét chữ (sharpen), tự động điều chỉnh độ tương phản và upscale ảnh lên tới kích thước 2000px chiều rộng.
- 📄 **Flawless PDF Forge**: Scale ảnh theo định dạng hình học A4 cực kỳ hoàn hảo. Không viền (zero margins), không méo ảnh, không bị cắt xén chữ. Tự động xử lý trong suốt (transparently) các định dạng ảnh hiện đại như `.webp`, convert mượt mà ngay khi đưa vào PDF.
- 💻 **Trải nghiệm Peak CLI**: Xây dựng với khả năng điều hướng raw TTY bằng bàn phím, font chữ Chrome 3D bóng bẩy từ `cfonts`, hệ thống layout `boxen`, hiệu ứng loading chuyên nghiệp từ `ora`, và hiệu ứng chuyển màu Aurora đem lại trải nghiệm đỉnh cao cho lập trình viên.

## 📦 Cài đặt

Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/), sau đó clone và thiết lập dự án:

```bash
# Clone repository
git clone https://github.com/tanbaycu/AetherForge.git

# Di chuyển vào thư mục dự án
cd AetherForge

# Cài đặt các thư viện phụ thuộc
npm install
```

## ⚡ Sử dụng

Khởi chạy bảng điều khiển CLI tương tác:

```bash
npm start
```
*Hoặc bạn có thể chạy trực tiếp bằng lệnh `node index.js`.*

### Điều hướng tương tác
- Sử dụng phím mũi tên `↑` và `↓` để điều hướng qua menu CLI tuyệt đẹp.
- Nhấn `Enter` để chọn tính năng (Full Pipeline, Chỉ tải ảnh, Tăng nét Enhance, hoặc Xuất PDF).
- Nhấn `Esc` để thoát ứng dụng an toàn.

## 📸 Hình ảnh Demo

*(Khu vực này dành để bạn chèn các hình ảnh/video demo dự án. Hãy thay thế các đoạn chữ bên trong dấu ngoặc đơn bằng link ảnh thực tế của bạn)*

![Ảnh Demo CLI 1](link-anh-demo-cli-1-vao-day)
*Giao diện tương tác 3D Chrome CLI siêu mượt*

![Ảnh Demo Output](link-anh-demo-pdf-vao-day)
*Kết quả xuất PDF không viền chuẩn A4*

![Ảnh Demo So sánh AI](link-anh-demo-ai-enhance-vao-day)
*So sánh ảnh trước và sau khi được AI Upscale + Sharpen*

## 🔬 Cơ chế hoạt động

1. **Input**: Dán URL từ bất kỳ nền tảng nào được hỗ trợ (Hoạt động mượt nhất với Facebook/TikTok).
2. **Scrape**: Engine cào dữ liệu sẽ vượt qua các giới hạn, lùng sục DOM/API và kéo về các tài nguyên độ phân giải cao nhất từ hệ thống CDN.
3. **Enhance**: Chạy ngầm một tiến trình xử lý từng ảnh một, làm nét các tài liệu nhiều chữ và áp dụng thuật toán upscale Lanczos3.
4. **Compile**: Tạo ra một file PDF A4 hoàn chỉnh, thẳng tắp và sẵn sàng để lưu trữ hoặc in ấn.

## 🤝 Đóng góp (Contributing)

Mọi đóng góp, báo lỗi (issues), và yêu cầu tính năng (feature requests) đều được chào đón! Đừng ngần ngại ghé thăm [trang issues](https://github.com/tanbaycu/AetherForge/issues).

**Kêu gọi Cộng đồng Mã nguồn mở (Open Source Contributors)!** 🌍  
Mặc dù AetherForge hiện đang thống trị nền tảng Facebook và TikTok, engine đa nền tảng này được thiết kế để mở rộng dễ dàng. Chúng tôi cực kỳ khuyến khích bạn gửi các **Pull Requests (PRs)** để hỗ trợ thêm các nền tảng khác như:
- Instagram (Posts, Reels, Stories)
- Twitter / X (Threads, Media)
- Pinterest (Boards, Pins)
- Reddit (Galleries)

Hãy tham gia cùng chúng tôi để xây dựng bộ công cụ trích xuất bá đạo nhất thế giới!

## 📄 Bản quyền (License)

Dự án này được cấp phép theo [Giấy phép MIT](LICENSE).

---

<p align="center">
  <i>Được rèn đũa (Forged) cho hiệu năng và thẩm mỹ đỉnh cao nhất bởi <a href="https://github.com/tanbaycu">@tanbaycu</a>.</i>
</p>
