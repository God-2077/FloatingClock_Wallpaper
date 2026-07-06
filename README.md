# 二次元随机壁纸（随机-可自定义）

Wallpaper Engine 网页壁纸，支持悬浮时钟、一言（Hitokoto）展示与壁纸轮播。

## 功能

- 数字时钟，带 VanillaTilt 3D 悬浮倾斜效果
- 一言句子展示，点击 / 按 `R` 键手动刷新，支持自动定时刷新
- 壁纸轮播模式（可配置 URL 列表与间隔）
- 双击时钟切换装饰元素显示/隐藏
- 入场动画 & 过渡效果
- 支持 Wallpaper Engine 暂停/恢复：暂停后当前周期完成后自动停止一言和轮播，恢复后继续运行

## 使用方法

下载 Steam 并安装 Wallpaper Engine

方式一，订阅 [\[web 二次元壁纸（随机-可自定义）\]](https://steamcommunity.com/sharedfiles/filedetails/?id=3758991075)。

方式二，在 Wallpaper Engine 中点击--打开壁纸--从 Url 打开，输入 `https://god-2077.github.io/FloatingClock_Wallpaper/`。



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

## 工作流程

### 初始化
1. 页面加载后 1 秒延迟初始化（`setTimeout`）
2. 若 Wallpaper Engine 属性变更事件先触发，则提前初始化
3. 启动时钟、一言、壁纸三大模块

### 一言自动刷新
```
计时器开始 → 预加载下一句 → 计时器到期 → 切换句子 → [检查暂停]
  ├─ 未暂停 → 预加载 → 计时器开始 → 循环
  └─ 已暂停 → 标记 pending，停止
                ↓ WE 恢复 (setPaused)
             预加载 → 计时器开始 → 切换 → [检查暂停] → 循环
```

### 壁纸轮播
```
计时器开始 → 预加载下一张 → 计时器到期 → 淡入切换 → [检查暂停]
  ├─ 未暂停 → 预加载 → 计时器开始 → 循环
  └─ 已暂停 → 标记 pending，停止
                ↓ WE 恢复 (setPaused)
             预加载 → 计时器开始 → 切换 → [检查暂停] → 循环
```

### 暂停 / 恢复
- 暂停由 Wallpaper Engine 内置 `setPaused` 事件驱动，无需额外配置
- 暂停**不会立即中断**当前计时周期，而是在当次切换完成后停止
- 恢复后自动续上计时器，继续正常运行
