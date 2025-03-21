# 网页 Markdown 转换器

基于 Cloudflare Worker 和 AI 的免费、无需服务器自己部署的文件转 Markdown 工具。

## 支持的文件类型

| 文件类型 | 文件扩展名 | MIME 类型 |
|---------|-----------|-----------|
| PDF 文档 | `.pdf` | `application/pdf` |
| 图片*1 | `.jpeg`、`.jpg`、`.png`、`.webp`、`.svg` | `image/jpeg`、`image/png`、`image/webp`、`image/svg+xml` |
| HTML 文档 | `.html` | `text/html` |
| XML 文档 | `.xml` | `application/xml` |
| Microsoft Office 文档 | `.xlsx`、`.xlsm`、`.xlsb`、`.xls`、`.et` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`<br>`application/vnd.ms-excel.sheet.macroenabled.12`<br>`application/vnd.ms-excel.sheet.binary.macroenabled.12`<br>`application/vnd.ms-excel` |
| 开放文档格式 | `.ods` | `application/vnd.oasis.opendocument.spreadsheet` |
| CSV | `.csv` | `text/csv` |
| 苹果文件 | `.numbers` | `application/vnd.apple.numbers` |

> Cloudflare 对于大多数[格式转换](https://developers.cloudflare.com/workers-ai/markdown-conversion/)都是免费的。在某些情况下，例如图像转换，它可以使用 Workers AI 模型进行对象检测和摘要，如果超出 Workers AI 免费分配限制，则可能会产生额外费用。有关更多详细信息，请参阅[定价页面](https://developers.cloudflare.com/workers-ai/platform/pricing/)。

# 使用方法