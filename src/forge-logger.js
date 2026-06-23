/**
 * Module logger - Hiển thị output CLI đẹp mắt
 * Sử dụng chalk cho màu sắc terminal
 */

const chalk = require("chalk");

/**
 * Hiển thị banner khởi động - phiên bản interactive
 */
function printBanner() {
  const banner = `
  ${chalk.cyan("╔═══════════════════════════════════════════════════════╗")}
  ${chalk.cyan("║")}                                                       ${chalk.cyan("║")}
  ${chalk.cyan("║")}   ${chalk.magenta.bold("🖼️  TikTok Photo Extractor")}  ${chalk.gray("v1.0.0")}               ${chalk.cyan("║")}
  ${chalk.cyan("║")}   ${chalk.white("Tải ảnh slideshow • Enhance • Xuất PDF")}            ${chalk.cyan("║")}
  ${chalk.cyan("║")}                                                       ${chalk.cyan("║")}
  ${chalk.cyan("║")}   ${chalk.gray("↑↓  Chọn menu     Enter  Xác nhận")}                ${chalk.cyan("║")}
  ${chalk.cyan("║")}   ${chalk.gray("Ctrl+C  Thoát nhanh")}                               ${chalk.cyan("║")}
  ${chalk.cyan("║")}                                                       ${chalk.cyan("║")}
  ${chalk.cyan("╚═══════════════════════════════════════════════════════╝")}
`;
  console.log(banner);
}

/**
 * Hiển thị thông tin
 */
function printInfo(message) {
  console.log(chalk.blue("  ℹ ") + chalk.white(message));
}

/**
 * Hiển thị thông báo thành công
 */
function printSuccess(message) {
  console.log(chalk.green("  ✅ ") + chalk.green.bold(message));
}

/**
 * Hiển thị lỗi
 */
function printError(message) {
  console.log(chalk.red("  ❌ ") + chalk.red.bold(message));
}

/**
 * Hiển thị cảnh báo
 */
function printWarning(message) {
  console.log(chalk.yellow("  ⚠️  ") + chalk.yellow(message));
}

/**
 * Hiển thị tiến trình tải
 * @param {number} current - Số thứ tự hiện tại
 * @param {number} total - Tổng số
 * @param {string} label - Nhãn mô tả
 */
function printProgress(current, total, label) {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round(percent / 5);
  const bar =
    chalk.cyan("█").repeat(filled) +
    chalk.gray("░").repeat(20 - filled);

  process.stdout.write(
    `\r  ${chalk.blue("⏳")} [${bar}] ${chalk.white(`${percent}%`)} ${chalk.gray(`(${current}/${total})`)} ${chalk.gray(label)}    `
  );

  if (current === total) {
    console.log();
  }
}

module.exports = {
  printBanner,
  printInfo,
  printSuccess,
  printError,
  printWarning,
  printProgress,
};
