# 数字工具箱 - 文档转换后端

基于 **Python (FastAPI) + LibreOffice (headless)** 的独立文档转换服务，
为 Cloudflare Pages 前端提供 Word↔PDF 转换 API。

## 功能

| 接口 | 说明 |
|------|------|
| `GET  /health` | 健康检查（含 LibreOffice 检测） |
| `POST /api/doc/word2pdf` | Word (.doc/.docx) → PDF |
| `POST /api/doc/pdf2word` | PDF → Word (.docx)（文本型 PDF 有效） |

- 文件上限 50MB，超时 120 秒自动中断
- 转换任务在独立临时目录进行，完成后延迟 60 秒自动清理
- 临时目录默认 `/var/lib/toolbox-backend/tmp`，可用环境变量 `TOOLBOX_TEMP_DIR` 覆盖

## 本地启动

```bash
pip install -r requirements.txt
# 需要安装 LibreOffice
#   Debian/Ubuntu: apt-get install -y libreoffice-writer libreoffice-impress
export TOOLBOX_TEMP_DIR=/var/lib/toolbox-backend/tmp
uvicorn app:app --host 0.0.0.0 --port 8000
```

## VPS 部署（systemd + Nginx）

```bash
# 1. 安装依赖
sudo apt-get update && sudo apt-get install -y libreoffice-writer libreoffice-impress python3-pip
sudo pip3 install -r requirements.txt

# 2. 部署目录
sudo mkdir -p /opt/toolbox-backend
sudo cp app.py requirements.txt /opt/toolbox-backend/

# 3. systemd 服务 /etc/systemd/system/toolbox-backend.service
#    [Unit]
#    Description=Toolbox Doc Convert Backend
#    After=network.target
#    [Service]
#    User=www-data
#    WorkingDirectory=/opt/toolbox-backend
#    Environment="TOOLBOX_TEMP_DIR=/var/lib/toolbox-backend/tmp"
#    ExecStart=/usr/bin/uvicorn app:app --host 127.0.0.1 --port 8000
#    Restart=always
#    [Install]
#    WantedBy=multi-user.target

sudo systemctl daemon-reload && sudo systemctl enable --now toolbox-backend

# 4. Nginx 反向代理（可选，HTTPS 由 CF 边缘加密）
#    location /api/doc/ { proxy_pass http://127.0.0.1:8000; ... }
```

## 定时清理临时文件（隐私保护）

配套脚本 `cleanup_uploads.py`：**每 10 分钟**扫描临时目录，
彻底删除生成超过 **15 分钟** 的 Word/PDF/中间文件，不留用户隐私。

```bash
# 部署
sudo cp cleanup_uploads.py /opt/toolbox-backend/

# 添加到 crontab（crontab -e）
*/10 * * * * /usr/bin/python3 /opt/toolbox-backend/cleanup_uploads.py >> /var/log/toolbox-cleanup.log 2>&1

# 手动测试
python3 cleanup_uploads.py --dry-run   # 演练
python3 cleanup_uploads.py             # 正式执行
```

## 前端对接示例

```js
const fd = new FormData()
fd.append('file', file)
const res = await fetch(`${API_BASE}/api/doc/word2pdf`, { method: 'POST', body: fd })
const blob = await res.blob()
// 触发下载
const a = document.createElement('a')
a.href = URL.createObjectURL(blob)
a.download = 'converted.pdf'
a.click()
```

CORS 默认允许所有来源，生产环境建议在 `app.py` 中收敛为具体前端域名。
