/**
 * Module UI tùy chỉnh - Render giao diện terminal xịn xò
 * Sử dụng ANSI escape codes + raw stdin cho keyboard
 * Tạo trải nghiệm CLI premium, không phụ thuộc inquirer
 */

const chalk = require("chalk");
const readline = require("readline");
const boxen = require("boxen");
const ora = require("ora");
const CFonts = require("cfonts");
const gradient = require("gradient-string");

// ═══════════════════════════════════════════════════
// Gradients & Constants
// ═══════════════════════════════════════════════════

const AURORA_GRAD = gradient(['#00FF87', '#60EFFF']);
const CYBER_GRAD = gradient(['#FF00FF', '#0080FF']);
const NEON_GRAD = gradient(['#FF6B9D', '#00D4AA']);
const OCEAN_GRAD = gradient(['#0077B6', '#00B4D8']);

// (Bảo lưu cho API cũ nếu có chỗ dùng)
function gradientText(text, colors) {
  return gradient(colors)(text);
}
const NEON_GRADIENT = ["#FF6B9D", "#00D4AA"];
const FIRE_GRADIENT = ["#FF4500", "#FFD700"];
const OCEAN_GRADIENT = ["#0077B6", "#00B4D8"];
const CYBER_GRADIENT = ["#FF00FF", "#0080FF"];

// ═══════════════════════════════════════════════════
// Banner
// ═══════════════════════════════════════════════════

function drawBanner() {
  // Dùng CFonts chrome vì nó gọn gàng, vừa khít màn hình hẹp (VS Code split terminal)
  // Không bao giờ bị vỡ khung.
  CFonts.say('AETHER|FORGE', {
    font: 'chrome',
    align: 'center',
    gradient: '#00FF87,#60EFFF',
    transitionGradient: true,
    env: 'node',
    space: false
  });
  
  console.log(
    boxen(
      CYBER_GRAD("✨ AETHERFORGE EXTRACTOR ✨\n") + 
      chalk.gray("God-Tier Social Scraper & AI PDF Forge Engine\n") +
      chalk.hex("#00D4AA")("v1.0.0") + chalk.gray(" - Peak Edition"),
      {
        padding: { top: 0, bottom: 0, left: 4, right: 4 },
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "cyan",
        align: "center"
      }
    )
  );

  const hints = [
    [chalk.hex("#4DA9FF")("↑/↓"), "Nav"],
    [chalk.hex("#00D4AA")("Enter"), "Select"],
    [chalk.hex("#FF6B9D")("Esc"), "Quit"],
  ];
  const hintStr = hints.map(([key, desc]) => `${key} ${chalk.hex("#666")(desc)}`).join(chalk.hex("#444")(" • "));
  
  // Canh giữa hints
  const cols = process.stdout.columns || 80;
  const rawLen = hintStr.replace(/\x1B\[\d+m/g, '').length;
  const padding = Math.max(0, Math.floor(cols / 2 - rawLen / 2));
  console.log(" ".repeat(padding) + hintStr);
  console.log();
}

async function showAnimatedBanner() {
  console.clear();
  return new Promise((resolve) => {
    drawBanner();
    setTimeout(() => {
      resolve();
    }, 500); 
  });
}

function showStaticBanner() {
  console.clear();
  drawBanner();
}

// ═══════════════════════════════════════════════════
// Custom Menu Renderer
// ═══════════════════════════════════════════════════

function showMenu(title, items) {
  return new Promise((resolve) => {
    let currentSelectableIndex = 0;
    const selectableIndices = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i] !== "separator") selectableIndices.push(i);
    }

    function cleanup() {
      process.stdin.removeListener("keypress", onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    }

    function render() {
      const totalLines = items.length + 3;
      process.stdout.write(`\x1b[${totalLines}A`);
      process.stdout.write("\x1b[0J");

      console.log("  " + chalk.hex("#00D4AA")("❖ ") + chalk.bold.white(title));
      console.log("  " + chalk.hex("#333")("│"));

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item === "separator") {
          console.log("  " + chalk.hex("#333")("│") + "  " + chalk.hex("#333")("─".repeat(44)));
          continue;
        }

        const isSelected = i === selectableIndices[currentSelectableIndex];

        if (isSelected) {
          const pointer = chalk.hex("#00FF87")("▸ ");
          const label = chalk.bold.white(item.icon + " " + item.label);
          const desc = item.desc ? chalk.hex("#4DA9FF")(" " + item.desc) : "";
          console.log(
            "  " +
              chalk.hex("#333")("│") +
              " " +
              chalk.bgHex("#1a1a2e")(" " + pointer + label + desc + " ")
          );
        } else {
          const label = chalk.hex("#777")(item.icon + " " + item.label);
          const desc = item.desc ? chalk.hex("#444")(" " + item.desc) : "";
          console.log("  " + chalk.hex("#333")("│") + "  " + "  " + label + desc);
        }
      }

      console.log("  " + chalk.hex("#333")("└" + "─".repeat(48)));
    }

    const totalLines = items.length + 3;
    for (let i = 0; i < totalLines; i++) console.log();
    render();

    const rl = readline.createInterface({ input: process.stdin });
    readline.emitKeypressEvents(process.stdin, rl);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const onKeypress = (str, key) => {
      if (!key) return;

      if (key.name === "up" || key.name === "k") {
        currentSelectableIndex = Math.max(0, currentSelectableIndex - 1);
        render();
      } else if (key.name === "down" || key.name === "j") {
        currentSelectableIndex = Math.min(
          selectableIndices.length - 1,
          currentSelectableIndex + 1
        );
        render();
      } else if (key.name === "return") {
        cleanup();
        const selected = items[selectableIndices[currentSelectableIndex]];
        resolve(selected.value);
      } else if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cleanup();
        resolve("__exit__");
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

// ═══════════════════════════════════════════════════
// UI Form Helpers
// ═══════════════════════════════════════════════════

function promptInput(label, placeholder = "", validate = null) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prefix = chalk.hex("#00FF87")("  ▸ ");
    const hint = placeholder ? chalk.hex("#555")(` (${placeholder})`) : "";
    const prompt = prefix + chalk.bold.white(label) + hint + "\n" +
      "  " + chalk.hex("#333")("│ ") + chalk.hex("#4DA9FF")("❯ ");

    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim();

      if (validate) {
        const validationResult = validate(trimmed);
        if (validationResult !== true) {
          console.log("  " + chalk.red("│ ✗ " + validationResult));
          resolve(promptInput(label, placeholder, validate));
          return;
        }
      }

      if (trimmed) {
        console.log("  " + chalk.hex("#333")("│ ") + chalk.green("✓ ") + chalk.hex("#888")(trimmed));
      }
      console.log();
      resolve(trimmed);
    });
  });
}

function promptConfirm(label, defaultVal = true) {
  return new Promise((resolve) => {
    const prefix = chalk.hex("#00FF87")("  ▸ ");
    const hint = defaultVal
      ? chalk.hex("#555")(" [") + chalk.hex("#00D4AA")("Y") + chalk.hex("#555")("/n]")
      : chalk.hex("#555")(" [y/") + chalk.hex("#FF6B9D")("N") + chalk.hex("#555")("]");
    const prompt = prefix + chalk.bold.white(label) + hint + " ";

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      let result = defaultVal;
      if (trimmed === "y" || trimmed === "yes") result = true;
      if (trimmed === "n" || trimmed === "no") result = false;

      console.log(
        "  " + chalk.hex("#333")("│ ") + (result ? chalk.green("✓ Yes") : chalk.red("✗ No"))
      );
      resolve(result);
    });
  });
}

function promptNumber(label, defaultVal = 1) {
  return new Promise((resolve) => {
    const prefix = chalk.hex("#00FF87")("  ▸ ");
    const hint = chalk.hex("#555")(` (Mặc định: ${defaultVal})`);
    const prompt = prefix + chalk.bold.white(label) + hint + "\n" +
      "  " + chalk.hex("#333")("│ ") + chalk.hex("#4DA9FF")("❯ ");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) {
        console.log("  " + chalk.hex("#333")("│ ") + chalk.green("✓ ") + chalk.hex("#888")(defaultVal));
        resolve(defaultVal);
        return;
      }

      const num = parseInt(trimmed, 10);
      if (isNaN(num)) {
        console.log("  " + chalk.red("│ ✗ Vui lòng nhập một số hợp lệ."));
        resolve(promptNumber(label, defaultVal));
        return;
      }
      console.log("  " + chalk.hex("#333")("│ ") + chalk.green("✓ ") + chalk.hex("#888")(num));
      resolve(num);
    });
  });
}

// ═══════════════════════════════════════════════════
// UI Feedback Helpers
// ═══════════════════════════════════════════════════

function showStepHeader(stepNum, totalSteps, icon, title) {
  const dots = chalk.hex("#333")("●".repeat(stepNum) + "○".repeat(totalSteps - stepNum));
  console.log(`  ${dots}  ${chalk.bold.cyan(icon + " " + title)}`);
}

function createSpinner(text) {
  const spinner = ora({
    text: " " + chalk.hex("#AAA")(text),
    spinner: "dots12",
    color: "cyan"
  });

  return {
    start() {
      spinner.start();
      return this;
    },
    update(newText) {
      spinner.text = " " + chalk.hex("#AAA")(newText);
    },
    succeed(msg) {
      spinner.succeed(" " + chalk.green.bold(msg));
    },
    fail(msg) {
      spinner.fail(" " + chalk.red.bold(msg));
    },
    warn(msg) {
      spinner.warn(" " + chalk.yellow.bold(msg));
    },
  };
}

function showSummaryBox(items) {
  let content = "";
  for (const [key, value] of items) {
    content += `${chalk.hex("#888")(key.padEnd(20))} ${chalk.cyan.bold(value)}\n`;
  }
  
  console.log();
  console.log(
    boxen(content.trim(), {
      title: chalk.bold.white(" 📊 KẾT QUẢ "),
      padding: 1,
      margin: { left: 2 },
      borderStyle: "round",
      borderColor: "green"
    })
  );
  console.log();
}

function showHistoryCard(data) {
  let content = `📁 ${chalk.bold.white(data.dir)}\n`;
  content += `📅 ${chalk.hex("#888")(data.date)}\n`;
  content += `👤 ${chalk.hex("#888")(data.author)}\n`;
  content += `🖼️  ${chalk.hex("#4DA9FF")(data.imgCount + " ảnh")}\n`;
  if (data.pdfs) {
    content += `📄 ${chalk.hex("#FFD700")(data.pdfs)}`;
  }
  
  console.log(
    boxen(content.trim(), {
      padding: 1,
      margin: { left: 2 },
      borderStyle: "round",
      borderColor: "blue"
    })
  );
}

// ═══════════════════════════════════════════════════
// Animation Helpers
// ═══════════════════════════════════════════════════

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typewriter(text, speed = 30, colorFn = chalk.white) {
  for (let i = 0; i <= text.length; i++) {
    process.stdout.write(`\r${colorFn(text.substring(0, i))}${"░".repeat(1)}`);
    await sleep(speed);
  }
  process.stdout.write(`\r${colorFn(text)}  \n`);
}

async function showGoodbye() {
  console.log();
  const msg = "  👋 AetherForge xin chào tạm biệt!";
  await typewriter(msg, 20, chalk.cyan);
  console.log(
    boxen(
      chalk.hex("#FFD700")("📚 Cảm ơn bạn đã đồng hành!") + "\n" +
      chalk.hex("#555")("Chỉ phục vụ mục đích học tập"),
      { padding: 1, margin: { left: 2 }, borderStyle: "round", borderColor: "yellow" }
    )
  );
  console.log();
}

function waitForContinue() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(chalk.hex("#555")("  ↩  Nhấn Enter để quay lại menu..."), () => {
      rl.close();
      resolve();
    });
  });
}

module.exports = {
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
  gradientText,
  sleep,
  waitForContinue,
  NEON_GRADIENT,
  FIRE_GRADIENT,
  OCEAN_GRADIENT,
  CYBER_GRADIENT,
};
