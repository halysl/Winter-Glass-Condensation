# Winter Glass Condensation (冬日窗霜)

一个模拟在结霜的窗户上涂画的 Web 应用。在这个静谧的冬日场景中，你可以用指尖擦去雾气，看着水珠缓缓滑落，感受窗外的朦胧景色。

![Project Preview](https://via.placeholder.com/800x450?text=Winter+Glass+Preview)

## ✨主要功能

- **拟真雾气**：逼真的窗户结霜效果，支持自定义雾气浓度。
- **动态水珠**：基于物理的动态水珠模拟，随重力滑落并擦除雾气。
- **自然交互**：支持鼠标和触摸屏（移动端友好），流畅的涂抹体验。
- **自定义背景**：支持上传本地图片作为窗外风景。
- **保存作品**：一键将你的画作（包含背景、笔触和水珠）保存为图片。
- **冬日氛围**：精心设计的 UI 和视觉效果，沉浸式的冬日体验。

## 🚀 快速开始

### 本地运行

该项目是纯静态的 HTML/CSS/JS 应用，无需复杂的构建过程。

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/Winter-Glass-Condensation.git
   cd Winter-Glass-Condensation
   ```

2. **启动服务**
   你可以直接双击 `index.html` 打开，但为了获得最佳体验（避免浏览器的跨域限制影响图片加载），建议使用本地服务器：

   **使用 Python:**
   ```bash
   python3 -m http.server 8000
   ```
   然后访问 `http://localhost:8000`

   **使用 Node.js (serve):**
   ```bash
   npx serve .
   ```

## 🌐 部署指南 (Cloudflare Pages)

此项目非常适合部署在 Cloudflare Pages 上，不仅速度快，而且节能环保。

1. **准备 GitHub 仓库**
   - 确保你的代码已推送到 GitHub 仓库。

2. **连接 Cloudflare Pages**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
   - 进入 **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**。
   - 选择你的 `Winter-Glass-Condensation` 仓库。

3. **配置构建设置**
   - **Framework preset**: 选择 `None` (因为是纯静态站点)。
   - **Build command**: (留空)。
   - **Build output directory**: `.` (或者如果你把文件放在 `public` 目录，则填 `public`，本项目直接填根目录即可，若根目录无效尝试 `.` 或留空)。
   - 点击 **Save and Deploy**。

4. **完成！**
   - 等待几秒钟，你的冬日窗霜应用就已经上线了！

## 🛠️ 技术栈

- **Core**: HTML5 Canvas, Vanilla JavaScript (ES6+)
- **Style**: CSS3 (Glassmorphism, Animations, Responsive Grid)
- **Zero Dependencies**: 无需 npm install，轻量高效。

## 📝 待办 / 计划

- [ ] 添加更多预设背景图
- [ ] 优化移动端性能
- [ ] 增加更多画笔纹理（如手指纹理）

---

Created with ❄️ by [Your Name]
