# Properties / YAML 互转在线工具

一个纯前端在线工具，用于在 Java `.properties` 配置与 YAML 配置之间双向转换。

## 功能

- Properties 转 YAML
- YAML 转 Properties
- 支持点号 key 转嵌套 YAML
- 支持基础标量类型：字符串、数字、布尔值、null
- 输入错误提示
- 示例填充、复制、清空、左右交换
- 无后端、无构建依赖，可直接部署到 GitHub Pages

## 本地运行

直接用浏览器打开 `index.html`，或启动静态服务：

```bash
python3 -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

## 部署到 GitHub Pages

推送到 GitHub 后，在仓库 Settings → Pages 中选择 `main` 分支和根目录即可。
