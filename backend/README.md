# 数字工具箱 · 文档转换后端部署指南

基于 **FastAPI + LibreOffice headless** 的独立文档转换服务，
部署在自有 VPS，为 Cloudflare Pages 前端提供 `/api/doc/*` 接口。

## 1. 安装依赖

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y python3-pip python3-venv libreoffice-writer libreoffice-impress

# Python 虚拟环境
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 2. 启动服务

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

生产环境建议 systemd 托管：

```ini
# /etc/systemd/system/toolbox-doc.service
[Unit]
Description=Toolbox Doc Converter
After=network.target

[Service]
WorkingDirectory=/opt/toolbox-backend
ExecStart=/opt/toolbox-backend/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now toolbox-doc
```

## 3. Nginx 反代（可选，建议加 HTTPS）

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;
    # ssl_certificate ...;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. 接口测试

```bash
# 健康检查
curl http://localhost:8000/health

# Word → PDF
curl -F "file=@test.docx" http://localhost:8000/api/doc/word2pdf -o test.pdf

# PDF → Word
curl -F "file=@test.pdf" http://localhost:8000/api/doc/pdf2word -o test.docx
```

## 5. 前端对接（Vue 3 标准 Fetch）

```js
async function convertDoc(file, endpoint) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`https://你的后端域名${endpoint}`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error((await res.json())?.detail || '转换失败')
  return await res.blob()  // 前端用 URL.createObjectURL 生成下载链接
}
```

## 6. 注意事项

- **PDF → Word**：LibreOffice 对文本型 PDF（可选中文字）转换效果好；
  扫描件/图片型 PDF 需要 OCR，LibreOffice 原生不支持，建议另接 OCR 服务。
- **并发**：LibreOffice 并行转换可能锁冲突，代码已为每个任务使用独立 HOME；
  如需更高并发，可部署多实例或用消息队列串行化。
- **安全**：生产环境务必限制 CORS 为前端域名、加接口鉴权（如简单 Token Header）。
