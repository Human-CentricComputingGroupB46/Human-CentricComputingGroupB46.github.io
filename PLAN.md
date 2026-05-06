# CampusCompass - EB楼室内导航系统 实现计划

## 项目概述

基于 Google Maps + Canvas 覆盖层的 EB 楼室内导航系统，作为固定位置指示牌使用。
用户通过右侧数字面板输入房间号，系统计算并展示从当前入口到目标房间的最短路径。

**技术栈**: TypeScript + Vite + Google Maps API + HTML Canvas

---

## 阶段一：项目脚手架与基础布局

### Step 1.1 - 项目初始化
- `npm create vite@latest` 初始化 TypeScript 项目
- 安装依赖：`@googlemaps/js-api-loader`
- 配置 `tsconfig.json`、`vite.config.ts`
- 创建目录结构：

```
src/
  main.ts                  # 入口文件
  styles/
    global.css             # 全局样式
    header.css             # 顶栏样式
    sidebar.css            # 右侧面板样式
    map.css                # 地图区域样式
    design-mode.css        # 设计模式样式
  components/
    Header.ts              # 顶栏组件
    FloorTabs.ts           # 楼层切换标签
    MapView.ts             # 地图视图（Google Maps + Canvas）
    Sidebar.ts             # 右侧导航面板
    Numpad.ts              # 数字键盘
    EntranceSelector.ts    # 入口选择器 (NW/NE/SW)
    Legend.ts              # 图例
    DesignPanel.ts         # 设计模式面板
  core/
    types.ts               # 类型定义
    constants.ts           # 常量（房间列表、坐标等）
    graph.ts               # 图数据结构与最短路径算法
    renderer.ts            # Canvas 渲染器（房间、走廊、路线）
    coordinate.ts          # 坐标转换（相对坐标 <-> 地图像素）
    state.ts               # 全局状态管理
  data/
    floor1.ts              # 一楼房间与走廊数据
    floor2.ts              # 二楼房间与走廊数据
```

### Step 1.2 - HTML 骨架与全局布局
- 创建 `index.html`：header + main (map区域 + sidebar)
- CSS Grid/Flex 布局：左侧地图占主体，右侧固定宽度面板
- 响应式考虑（指示牌固定分辨率，可不做响应式）

---

## 阶段二：类型系统与数据建模

### Step 2.1 - 核心类型定义 (`types.ts`)
```typescript
// 关键类型
type FloorId = 'floor1' | 'floor2';

interface Point { x: number; y: number; }  // 相对坐标 (0-1 归一化)

interface Room {
  id: string;          // 如 "EB104"
  label: string;
  floor: FloorId;
  position: Point;     // 房间中心的相对坐标
  width: number;       // 相对宽度
  height: number;      // 相对高度
  type: 'room' | 'toilet' | 'elevator' | 'staircase' | 'inaccessible';
}

interface Entrance {
  id: 'NW' | 'NE' | 'SW';
  floor: FloorId;
  position: Point;
}

interface Corridor {
  id: string;
  floor: FloorId;
  path: Point[];       // 走廊折线的相对坐标点序列
}

interface GraphNode {
  id: string;
  position: Point;
  floor: FloorId;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;      // 距离/权重
}

interface AppState {
  currentFloor: FloorId;
  currentEntrance: 'NW' | 'NE' | 'SW';
  targetRoom: string | null;
  route: GraphNode[] | null;
  designMode: boolean;
}
```

### Step 2.2 - 楼层数据 (`floor1.ts`, `floor2.ts`)

**一楼房间列表**（根据实际平面图）：
- 北侧走廊沿线：EB140, EB139, EB137, EB133, EB131A, EB131, EB119, EB115, EB111, EB109, EB107
- 中部：EB136, EB132, EB121, EB117, EB113, EB106, EB102
- 南部：EB138, EB104
- 东南区域：EB155, EB157, EB159, EB161
- 入口：NW（西北），NE（东北），SW（西南）
- 电梯：北侧中部、南侧
- 楼梯：西北角、东北角、西南角

**一楼走廊连接关系**：
- NW入口 → 北侧走廊 → NE入口（可通行）
- NW入口 ✗ SW入口（一楼不直连，需经室外）
- 北侧走廊连接北侧所有房间
- 中部走廊连接中部房间
- 南侧通道连接 EB155/EB161 区域

**二楼房间列表**：
- 北侧走廊沿线：EB237, EB233, EB231, EB211, EB239, EB235
- 南侧走廊沿线：EB222, EB220, EB218, EB216, EB214, EB212, EB210, EB206
- 西南区域：EB236, EB138(共用), EB282, EB287, EB283, EB280, EB277, EB275, EB273
- 南侧：EB279, EB271, EB269, EB265, EB265A, EB261
- 东侧走廊沿线：EB241, EB245, EB247, EB249, EB251, EB253, EB257, EB259
- Roof Garden（不可通行区域）
- 楼梯/电梯连接一楼

**二楼走廊**：
- 北侧走廊（连接北侧房间）
- 南侧走廊（连接南侧房间）
- 东侧走廊（连接东侧房间）

---

## 阶段三：地图与渲染

### Step 3.1 - Google Maps 初始化 (`MapView.ts`)
- 加载 Google Maps，中心坐标：XJTLU 北校区 EB楼
  - 参考坐标约为：`31.2750°N, 120.7395°E`（需实地校准）
- 设置卫星视图、合适的缩放级别
- 禁用不必要的地图控件（仅保留缩放）

### Step 3.2 - Canvas 覆盖层 (`renderer.ts`)
- 使用 Google Maps OverlayView 创建 Canvas 覆盖层
- 覆盖层锚定到 EB 楼的地理边界（LatLngBounds）
- 所有房间、走廊、路线在 Canvas 上绘制

### Step 3.3 - 坐标系统 (`coordinate.ts`)
- 定义楼宇边界的地理坐标（四角经纬度）
- 相对坐标 (0~1) → Canvas 像素坐标 的转换函数
- Canvas 像素 → 地理坐标 的逆转换（用于设计模式）
- **关键**：房间/走廊/入口绑定相对坐标，楼层图层绑定经纬度

### Step 3.4 - 房间与走廊绘制
- 绘制房间矩形（半透明填充 + 边框 + 标签）
- 绘制走廊（灰色线条）
- 绘制入口标记（NW/NE/SW 圆形橙色标记）
- 绘制不可通行区域（斜线填充）
- 绘制电梯/楼梯图标
- 绘制"You are here"标记

---

## 阶段四：UI 组件

### Step 4.1 - Header 组件 (`Header.ts`)
- 左侧：Logo + "CampusCompass" + "EB Building · Floors 1 and 2 Navigation"
- 右侧："OPEN DESIGN" 按钮 + "DEMO MODE" 按钮 + 当前时间显示
- 深色背景 (#1a1a2e 或类似)

### Step 4.2 - 楼层切换 (`FloorTabs.ts`)
- "Floor 1" / "Floor 2" 标签按钮
- 切换时更新地图渲染的楼层数据
- 当前楼层高亮（橙色背景）

### Step 4.3 - 右侧面板 (`Sidebar.ts`)
- "You are here: North-West Entrance" 状态显示
- 入口选择器组件 (`EntranceSelector.ts`)
  - NW / NE / SW 三个按钮
  - 当前选中的入口高亮
- 房间号输入组件
  - "Room number" 标题
  - 输入框（前缀 "EB"，后面可输入数字）
  - "Go" 按钮
- 搜索历史：最近查询的房间号快捷按钮
- 数字键盘 (`Numpad.ts`)
  - 1-9, 0 数字键
  - Clear 按钮
  - 退格按钮（⌫）
  - Route 按钮（橙色，触发路线计算）

### Step 4.4 - 图例 (`Legend.ts`)
- 地图底部半透明条
- 图标：You are here (橙色圆) / Destination (绿色圆) / Route (橙色线) / Inaccessible (灰色)
- 说明文字

---

## 阶段五：寻路算法

### Step 5.1 - 图数据结构 (`graph.ts`)
- 将所有房间门口、走廊交叉点、入口建模为图节点
- 走廊连接、房间门口到走廊的连接建模为图边
- 边的权重 = 两节点间的欧式距离

### Step 5.2 - 跨楼层连接
- 电梯节点：一楼电梯 ↔ 二楼电梯（权重稍大，表示等待时间）
- 楼梯节点：一楼楼梯 ↔ 二楼楼梯
- **一楼特殊规则**：NW ↔ SW 不直连，需标记为不可通行
  - 如果起点是 NW 且目标在 SW 区域，路线需经过室外或经 NE 中转

### Step 5.3 - BFS/Dijkstra 最短路径
- 实现 Dijkstra 算法（加权最短路径）
- 输入：起点节点 ID（当前入口）、终点节点 ID（目标房间门口）
- 输出：经过的节点序列 → 用于绘制路线
- 跨楼层路径：自动识别需要上楼/下楼的情况

### Step 5.4 - 路线渲染
- 在 Canvas 上绘制橙色粗线，按节点序列连接
- 起点标记（橙色大圆 + 动画脉冲效果）
- 终点标记（绿色圆 + 房间高亮）
- 如果路线跨楼层，在电梯/楼梯处标注 "Take elevator/stairs to Floor X"

---

## 阶段六：状态管理与交互

### Step 6.1 - 全局状态 (`state.ts`)
- 简单的发布-订阅模式状态管理
- 状态变化时通知所有订阅组件重新渲染
- 状态项：当前楼层、当前入口、输入的房间号、计算的路线、设计模式开关

### Step 6.2 - 交互流程
1. 用户选择入口（NW/NE/SW）→ 更新"You are here"标记位置
2. 用户通过数字键盘输入房间号（如 "104"）
3. 点击 "Route" → 调用寻路算法 → 渲染路线
4. 如果房间在另一层，自动提示并在两层都画路线
5. 点击楼层标签切换楼层视图

---

## 阶段七：设计模式

### Step 7.1 - 设计模式入口 (`DesignPanel.ts`)
- 点击 "OPEN DESIGN" 按钮进入设计模式
- 地图左侧或底部弹出设计面板
- 设计模式下地图上的房间/走廊/入口可以拖拽

### Step 7.2 - 可拖拽元素
- 房间：拖拽移动位置、拖拽角调整大小
- 走廊：拖拽折线控制点
- 入口：拖拽移动位置
- 新增：可添加新房间/走廊节点

### Step 7.3 - 数据导出/导入
- "Export JSON" 按钮：将当前所有房间、走廊的相对坐标导出为 JSON
- "Import JSON" 按钮：从 JSON 文件导入布局数据
- 导出的 JSON 可直接替换 `floor1.ts` / `floor2.ts` 中的数据
- LocalStorage 自动保存设计状态

---

## 阶段八：细节打磨

### Step 8.1 - 方向指示
- 地图上显示方向说明：Top = North, Bottom = South, Left = West, Right = East
- 指南针图标

### Step 8.2 - 动画与视觉效果
- "You are here" 标记的脉冲动画
- 路线绘制动画（从起点到终点逐段显示）
- 楼层切换过渡动画

### Step 8.3 - 错误处理
- 输入不存在的房间号：提示 "Room not found"
- 无法到达的房间：提示 "No route available"
- 地图加载失败的降级方案

### Step 8.4 - DEMO MODE
- 自动演示模式：循环展示不同入口到不同房间的路线
- 每隔几秒自动切换一个路线示例

---

## 实现顺序建议

| 序号 | 步骤 | 依赖 | 预计文件 |
|------|------|------|----------|
| 1 | 项目初始化 + 目录结构 | 无 | vite配置, package.json |
| 2 | 类型定义 | 无 | `types.ts` |
| 3 | 一楼/二楼数据 | Step 2 | `floor1.ts`, `floor2.ts`, `constants.ts` |
| 4 | HTML骨架 + 全局CSS | Step 1 | `index.html`, `global.css` |
| 5 | Header 组件 | Step 4 | `Header.ts`, `header.css` |
| 6 | Google Maps 初始化 | Step 1 | `MapView.ts`, `map.css` |
| 7 | 坐标系统 | Step 2,3 | `coordinate.ts` |
| 8 | Canvas 渲染器 | Step 6,7 | `renderer.ts` |
| 9 | 楼层切换 | Step 6,8 | `FloorTabs.ts` |
| 10 | 右侧面板 + 数字键盘 | Step 4 | `Sidebar.ts`, `Numpad.ts`, `EntranceSelector.ts`, `sidebar.css` |
| 11 | 状态管理 | Step 2 | `state.ts` |
| 12 | 图数据结构 + 寻路 | Step 3,11 | `graph.ts` |
| 13 | 路线渲染 | Step 8,12 | `renderer.ts` 扩展 |
| 14 | 图例 | Step 8 | `Legend.ts` |
| 15 | 设计模式 | Step 8,11 | `DesignPanel.ts`, `design-mode.css` |
| 16 | 动画与打磨 | 全部 | 各文件优化 |
| 17 | DEMO模式 | Step 13 | `state.ts` 扩展 |

---

## 关键注意事项

1. **坐标系统分离**：房间/走廊/入口使用归一化相对坐标 (0~1)，只有楼层图层整体锚定到地理经纬度。这样设计模式调整位置时只改变相对坐标，不影响地图定位。

2. **一楼连通性**：NW ↔ NE 通过北侧走廊连通；NW ✗ SW 一楼不连通（图中两区域物理隔断）。路径算法需正确建模此约束。

3. **跨楼层导航**：通过电梯/楼梯节点在两层之间建立连接。路线结果可能跨楼层，需在两层分别显示路径段。

4. **设计模式数据持久化**：设计模式的调整结果存入 LocalStorage，并可导出为 JSON 供开发者更新源码数据。

5. **EB楼地理坐标**：XJTLU 北校区 EB 楼，需在 Google Maps 上确认精确的楼宇四角经纬度来锚定覆盖层。
