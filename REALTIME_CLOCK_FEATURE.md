# 实时时钟功能说明

## 功能概述
为首屏头部信息区域添加了实时时钟显示功能，支持多种时间格式和12/24小时制切换。

## 修改文件清单

### 1. 配置文件 (settings.yaml)
**位置**: `settings.yaml` (第165-192行)

**主要配置项**:
```yaml
- $formkit: checkbox
  name: focus_info_realtime_clock
  id: focus_info_realtime_clock
  key: focus_info_realtime_clock
  if: "$get(head_focus).value == true"
  label: 显示实时时间
  help: 在首屏头部信息区域显示实时时钟
  value: false

- $formkit: select
  name: focus_info_clock_format
  id: focus_info_clock_format
  key: focus_info_clock_format
  if: "$get(focus_info_realtime_clock).value == true"
  label: 时间格式
  value: datetime
  options:
    - value: time
      label: 仅时间 (HH:MM:SS)
    - value: date
      label: 仅日期 (YYYY-MM-DD)
    - value: datetime
      label: 日期时间 (YYYY-MM-DD HH:MM:SS)
    - value: datetime_week
      label: 日期时间+星期

- $formkit: checkbox
  name: focus_info_clock_use_12hour
  id: focus_info_clock_use_12hour
  key: focus_info_clock_use_12hour
  if: "$get(focus_info_realtime_clock).value == true"
  label: 使用12小时制
  value: false

- $formkit: text
  name: focus_title_font_size
  label: 故障文字字体大小
  value: 5rem

- $formkit: text
  name: focus_title_font_family
  label: 故障文字字体
  value: Ubuntu, sans-serif

- $formkit: text
  name: focus_clock_font_size
  label: 时间字体大小
  value: 2.5rem

- $formkit: text
  name: focus_clock_font_family
  label: 时间字体
  value: Ubuntu, sans-serif
```

### 2. HTML 模板 (templates/module/home/img_box.html)
**位置**: `templates/module/home/img_box.html` (第37-51行)

**修改内容**:
- 将时钟从 `.header-info` 中独立出来并放置在故障文字下方
- 新增首屏文字与时钟字体/字号的自定义能力

**更新后的 HTML 结构**:
```html
<div
  class="realtime-clock-glitch center-text glitch"
  th:if="${theme.config.mainScreen.focus_info_realtime_clock}"
  th:attr="
    data-format=${theme.config.mainScreen.focus_info_clock_format ?: 'datetime'},
    data-use-12hour=${theme.config.mainScreen.focus_info_clock_use_12hour ?: false}
  "
  th:style="|--focus-clock-font-size: ${theme.config.mainScreen.focus_clock_font_size ?: '2.5rem'}; --focus-clock-font-family: ${theme.config.mainScreen.focus_clock_font_family ?: 'Ubuntu, sans-serif'};|"
  data-text="Loading..."
>
  Loading...
</div>
```

### 3. CSS 样式 (src/css/common/components/screen/img-box/focus-tou.css)
**位置**: `src/css/common/components/screen/img-box/focus-tou.css`

**关键样式**:
```css
.center-text {
  font-family: var(--focus-title-font-family, "Ubuntu", sans-serif);
  font-size: var(--focus-title-font-size, 5rem);
}

.realtime-clock-glitch {
  font-family: var(--focus-clock-font-family, "Ubuntu", sans-serif);
  font-size: var(--focus-clock-font-size, 2.5rem);
  font-variant-numeric: tabular-nums;

  @mixin screens-md {
    font-size: var(--focus-clock-font-size-mobile, 1.5rem);
  }
}
```

### 4. JavaScript 逻辑 (src/page/index.ts)
**位置**: `src/page/index.ts` (第4-74行)

**添加的功能**:
```typescript
/**
 * 注册实时时钟功能
 */
@documentFunction()
public registerRealtimeClock() {
  // 获取时钟元素和配置
  // 支持4种时间格式：time, date, datetime, datetime_week
  // 支持12小时制/24小时制切换
  // 每秒更新一次时间显示
  // 支持多语言星期显示
}
```

### 5. 国际化文件

#### 中文 (src/languages/zh.json)
```json
"clock": {
  "weekdays": "日,一,二,三,四,五,六"
}
```

#### 英文 (src/languages/en.json)
```json
"clock": {
  "weekdays": "Sun,Mon,Tue,Wed,Thu,Fri,Sat"
}
```

#### 日文 (src/languages/ja.json)
```json
"clock": {
  "weekdays": "日,月,火,水,木,金,土"
}
```

## 功能特性

### 1. 时间格式选项
- **仅时间**: `HH:MM:SS`
- **仅日期**: `YYYY-MM-DD`
- **日期时间**: `YYYY-MM-DD HH:MM:SS`
- **日期时间+星期**: `YYYY-MM-DD 星期X HH:MM:SS` (中文) 或 `YYYY-MM-DD Day HH:MM:SS` (英文)

### 2. 12/24小时制
- 支持12小时制 (AM/PM)
- 默认使用24小时制

### 3. 多语言支持
- 星期显示根据当前语言自动切换
- 中文: 星期日、星期一...
- 英文: Sun, Mon, Tue...
- 日文: 日、月、火...

### 4. 动画效果
- 时钟图标持续旋转动画
- 时间文本平滑过渡效果

### 5. 响应式设计
- 使用等宽字体数字，避免跳动
- 自适应容器宽度

## 使用方法

1. 在 Halo 后台进入主题设置
2. 找到 "首屏" 设置组
3. 启用 "显示实时时间" 选项
4. 选择喜欢的时间格式
5. 选择是否使用12小时制
6. 保存设置并刷新页面

## 技术亮点

1. **架构设计合理**: 
   - 配置在 YAML 中管理
   - 样式与逻辑分离
   - 使用装饰器模式注册功能

2. **国际化支持**:
   - 星期显示根据语言自动适配
   - 易于扩展其他语言

3. **性能优化**:
   - 使用 `setInterval` 精确控制更新频率
   - CSS 动画使用 GPU 加速

4. **用户体验**:
   - 配置选项丰富
   - 视觉效果美观
   - 与现有主题风格一致

## 兼容性

- 兼容所有现代浏览器
- 移动端自动适配
- 不影响主题其他功能

## 文件结构

```
halo-theme-sakura-2.4.3/
├── settings.yaml                        # 主题配置文件 (已修改)
├── templates/
│   └── module/
│       └── home/
│           └── img_box.html            # 首屏HTML模板 (已修改)
├── src/
│   ├── page/
│   │   └── index.ts                    # 首页JavaScript逻辑 (已修改)
│   ├── css/
│   │   └── common/
│   │       └── components/
│   │           └── screen/
│   │               └── img-box/
│   │                   └── info.css    # 头部信息样式 (已修改)
│   └── languages/
│       ├── zh.json                     # 中文翻译 (已修改)
│       ├── en.json                     # 英文翻译 (已修改)
│       └── ja.json                     # 日文翻译 (已修改)
└── templates/assets/dist/              # 编译后的文件 (自动生成)
```

## 后续优化建议

1. 可以添加更多时间格式选项
2. 可以添加时区选择功能
3. 可以添加倒计时功能
4. 可以自定义时钟颜色
5. 可以添加日历弹窗功能
