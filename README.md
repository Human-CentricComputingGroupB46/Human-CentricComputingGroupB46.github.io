# CampusCompass

这是一个面向 EB 教学楼的室内导航原型。项目的核心目标是：让用户输入房间号后，页面能根据入口位置、楼层数据和连通关系，给出清晰的步行路线，并在地图上画出来。

这次重构的重点不是单纯“把一个大文件切碎”，而是把原来混在一起的几类职责拆开：启动流程、演示模式逻辑、地图绘制、设计编辑器、共享状态、静态数据。这样做以后，初学者可以先看主流程，再按兴趣深入某一个模块，而不用一上来面对一个几千行的大文件。

## 项目入口

- 运行页面的主要目录是 web_code
- 正常演示模式地址是 http://127.0.0.1:4173/
- 设计与布局编辑模式地址是 http://127.0.0.1:4173/?mode=design

如果本地没有启动静态服务器，可以在仓库根目录执行下面的命令进入页面目录后启动：

python3 -m http.server 4173

然后在浏览器里打开上面的地址。

## 重构后的 JavaScript 架构

现在页面的脚本职责按“从外到内”的方式分成了几层：

- 启动入口：[web_code/app.js](web_code/app.js)
	只负责触发应用启动，不再放业务细节。
- 共享运行时状态：[web_code/scripts/state.js](web_code/scripts/state.js)
	集中保存当前入口、目的地、当前楼层、地图实例、编辑器状态等运行时数据。
- 演示模式控制器：[web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)
	负责页面启动、模式切换、入口选择、输入框、路线计算、步骤文案和状态面板。
- 地图渲染器：[web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js)
	负责初始化 Google Maps 或 Leaflet、做坐标换算、画房间、走廊、路径、标记和图层。
- 编辑器控制器：[web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)
	负责设计模式下的拖拽、缩放、加房间、连线编辑、删除元素、导出和保存布局数据。
- 静态数据层：[web_code/data.js](web_code/data.js)
	保存入口、服务点、可行走节点、房间数据、地图基准参数。
- 数据处理层：[web_code/data-processing.js](web_code/data-processing.js)
	负责坐标换算、房间查找、楼层工具函数和图结构构建。

这套结构对应的是一个很适合初学者理解的思路：

1. 数据放在一处
2. 状态放在一处
3. 算法和流程放在控制器
4. 绘制逻辑放在渲染器
5. 页面真正启动时只从一个很薄的入口进入

## 当前目录结构

和运行有关的主要文件如下：

- [web_code/index.html](web_code/index.html)
- [web_code/styles.css](web_code/styles.css)
- [web_code/app.js](web_code/app.js)
- [web_code/data.js](web_code/data.js)
- [web_code/data-processing.js](web_code/data-processing.js)
- [web_code/scripts/state.js](web_code/scripts/state.js)
- [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)
- [web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js)
- [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)
- [web_code/editor-server.js](web_code/editor-server.js)

其中最重要的变化是：[web_code/app.js](web_code/app.js) 现在已经不再承担主业务逻辑，真正的主线被移到了更容易理解的模块里。

## 页面启动顺序

如果你是第一次读这个项目，最值得先理解的是“页面到底怎么跑起来”。现在的顺序是：

1. [web_code/index.html](web_code/index.html) 先加载页面结构和脚本。
2. [web_code/data.js](web_code/data.js) 提供地图和房间原始数据。
3. [web_code/data-processing.js](web_code/data-processing.js) 把原始数据加工成更容易使用的工具函数和图结构。
4. [web_code/scripts/state.js](web_code/scripts/state.js) 创建整个应用共享的 state。
5. [web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js) 注册所有地图绘制和坐标转换函数。
6. [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js) 注册设计模式函数。
7. [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js) 注册演示模式函数，并提供初始化逻辑。
8. [web_code/app.js](web_code/app.js) 触发真正的启动。

你可以把它想成下面这个流程：

数据准备好 → 共享状态建立好 → 功能模块都挂好 → 启动入口调用初始化

## 运行时主线

用户真正使用 demo 时，主线是这样的：

1. 页面启动后调用 initializeCampusCompassApp
2. 读取 URL，判断当前是 demo 模式还是 design 模式
3. 调用 buildGraph 构建房间和走廊之间的图
4. 初始化地图底图和覆盖层
5. 绑定按钮、楼层切换、输入框、虚拟键盘等交互
6. 用户输入房间号后，调用 dijkstra 计算最短路径
7. renderMap 把路径、房间、入口、标记全部画到地图上
8. renderStatus 把文字步骤、距离和时间更新到右侧面板

这条主线现在主要集中在 [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)，因此初学者读代码时不会被地图细节和编辑器细节打断。

## 每个文件适合怎么看

如果你是 JavaScript 初学者，建议按下面顺序阅读：

1. [web_code/app.js](web_code/app.js)
	 看入口到底有多薄，先建立全局印象。
2. [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)
	 看启动函数、输入函数、路线函数、状态渲染函数，理解“业务流程”。
3. [web_code/data-processing.js](web_code/data-processing.js)
	 看 buildGraph、getRoom、getAvailableFloors 这些工具函数，理解“业务数据怎么组织”。
4. [web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js)
	 理解“为什么路径能画到地图上”。
5. [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)
	 最后再看设计模式下复杂的拖拽和保存逻辑。
6. [web_code/data.js](web_code/data.js)
	 回头看真实的房间和节点数据，就会更容易懂。

## 为什么这种架构更清晰

这次重构用了几个简单但实用的软件设计原则：

- 单一职责
	一个文件只处理一类主要问题，避免“既算路径又画地图又改数据”。
- 先数据，后行为
	房间、节点、地图基准放在数据文件里，业务逻辑不直接把数据写死在函数内部。
- 共享状态集中管理
	所有运行时状态都收在 state 里，调试时更容易知道当前页面处于什么状态。
- 控制器和渲染分离
	demo-controller 决定“做什么”，map-renderer 决定“怎么画出来”。
- 入口极薄
	新人打开项目时，先看到一个简单入口，再逐步走进模块，不会直接被大文件压住。

## demo 模式与 design 模式

项目现在保留两种工作方式：

- demo 模式
	面向最终用户，只关心输入房间号并查看路线。
- design 模式
	面向维护者，可以打开布局编辑、移动房间、改走廊、调整连线，并把数据导出或写回 data.js。

这两种模式共享同一套地图和数据，但职责已经分开：

- 用户导航逻辑主要在 [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)
- 布局编辑逻辑主要在 [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)

## 路径计算是怎么做的

路线计算仍然保持简单直观：

1. [web_code/data-processing.js](web_code/data-processing.js) 里的 buildGraph 会把入口、房间、服务点、走廊节点拼成一个图。
2. 每个节点之间的 links 表示可走的连接关系。
3. [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js) 里的 dijkstra 会从当前入口算到目标房间。
4. 算出来的 path 再交给 [web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js) 去画。

这里的好处是：算法和画图已经分开。你以后如果要换路径算法，主要改控制器；如果只想改颜色和画法，主要改渲染器。

## 设计模式是怎么工作的

设计模式下的核心思路也比以前更容易跟：

1. 开启编辑模式
2. 选中房间或走廊
3. 拖拽或缩放几何形状
4. 修改 state 和内存中的 ROOM_DATA 或 WALKABLE_NODES
5. 重新 buildGraph
6. 重新 renderMap
7. 如果需要，再把当前内存数据导出为 data.js 片段

这也是为什么编辑逻辑被单独放进 [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)：它和普通用户查路是两条不同的思维线。

## 这次重构解决了什么问题

重构前，最大的阅读障碍是一个文件里同时塞了：

- 页面启动
- 模式切换
- 输入框和键盘
- 路径算法
- 地图绘制
- 设计器拖拽
- 数据导出和保存

重构后，新的结构更适合教学和维护：

- 你可以只看 demo-controller 就理解用户流程
- 你可以只看 map-renderer 就理解地图层怎么画
- 你可以只看 editor-controller 就理解设计模式
- 你可以只看 data.js 和 data-processing.js 就理解数据模型

## 推荐的后续维护方式

以后继续改这个项目时，建议保持下面的约定：

- 新增页面业务流程，优先加到 [web_code/scripts/demo-controller.js](web_code/scripts/demo-controller.js)
- 新增地图视觉效果，优先加到 [web_code/scripts/map-renderer.js](web_code/scripts/map-renderer.js)
- 新增设计器能力，优先加到 [web_code/scripts/editor-controller.js](web_code/scripts/editor-controller.js)
- 新增房间、走廊、服务点，优先改 [web_code/data.js](web_code/data.js)
- 新增通用数据工具，优先改 [web_code/data-processing.js](web_code/data-processing.js)

只要沿着这个边界继续维护，项目就不会再退回到“所有东西都堆进一个大文件”的状态。
