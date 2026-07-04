# 插画壁纸 · 悬浮时钟 & 一言

Wallpaper Engine 网页壁纸，支持悬浮时钟、一言（Hitokoto）展示与壁纸轮播。

## 功能

- 数字时钟，带 VanillaTilt 3D 悬浮倾斜效果
- 一言句子展示，点击 / 按 `R` 键手动刷新，支持自动定时刷新
- 壁纸轮播模式（可配置 URL 列表与间隔）
- 双击时钟切换装饰元素显示/隐藏
- 入场动画 & 过渡效果

## 使用方法

1. 在 Wallpaper Engine 中导入本项目文件夹
2. 入口文件选择 `index.html`
3. 可根据需要修改 `js/main.js` 顶部的 `WALLPAPER_CONFIG` 配置

## 配置说明

编辑 `js/main.js` 中的 `WALLPAPER_CONFIG`：

```js
const WALLPAPER_CONFIG = {
    mode: 'carousel',           // 'default' | 'online' | 'carousel'
    onlineUrl: '',              // mode='online' 时填写图片 URL
    carouselUrls: ['...'],      // mode='carousel' 时填写图片 URL 数组
    carouselInterval: 60 * 1000, // 轮播间隔 (ms)
};
```

- `default`：使用本地默认壁纸 (`img/default-2048.jpg`)
- `online`：使用指定在线图片作为壁纸
- `carousel`：定时轮播多个在线图片

## 开发调试

本地开发服务器：

```bash
pip install rangehttpserver
python -m RangeHTTPServer 8091
```

然后在 Wallpaper Engine 中通过 Chrome DevTools 连接调试。

## 技术栈

- 纯 HTML / CSS / JavaScript（无框架）
- VanillaTilt（3D 倾斜效果）
- Hitokoto API（v1.hitokoto.cn）
- Google Fonts（Inter / Noto Serif SC）

## 快捷操作

| 操作 | 效果 |
|------|------|
| 点击一言区域 | 刷新句子 |
| 按 `R` 键 | 刷新一言 |
| 双击时钟 | 切换装饰显示 |
