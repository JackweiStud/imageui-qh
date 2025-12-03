# 预设背景图片说明

## 当前状态
- ✅ 已创建 7 张 SVG 占位图
- ✅ 图片路径已更新为本地路径
- ✅ 已添加图片加载错误处理

## 文件列表
1. `beach-vacation.svg` - 海滩度假场景
2. `shanghai-bund-night.svg` - 上海外滩夜景
3. `snow-mountain-summit.svg` - 雪山登顶
4. `football-field-center.svg` - 足球场中央
5. `autumn-park.svg` - 秋日公园
6. `cyberpunk-city.svg` - 赛博朋克城市
7. `space-station.svg` - 太空站

## 替换为真实图片（可选）

如果你想替换这些 SVG 占位图为真实的照片：

1. **准备图片文件**：
   - 推荐格式：JPG 或 PNG
   - 推荐尺寸：600x400px 或更高（保持 3:2 或 16:9 比例）
   - 文件大小：建议每张 < 200KB

2. **替换步骤**：
   - 将真实图片文件放入此目录
   - 文件名保持与 SVG 文件相同（仅扩展名改为 .jpg 或 .png）
   - 例如：`beach-vacation.jpg` 替换 `beach-vacation.svg`

3. **更新代码**：
   - 如果使用不同文件名，需要更新 `constants.tsx` 中的 `imageUrl` 路径

## 注意事项
- SVG 占位图是轻量级的，加载速度快
- 真实图片会提供更好的视觉效果，但会增加资源体积
- 所有图片路径都是相对于网站根目录的（`/images/presets/xxx`）

