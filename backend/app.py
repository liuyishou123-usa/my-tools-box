"""
数字工具箱 - 文档转换后端 (Python + LibreOffice)
==================================================
独立部署于 VPS，为 Cloudflare Pages 前端提供文档转换 API。

技术栈：FastAPI + LibreOffice (headless) + python-multipart

启动方式：
    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8000

接口一览：
    GET  /health                健康检查
    POST /api/doc/word2pdf      Word(.doc/.docx) → PDF
    POST /api/doc/pdf2word      PDF → Word(.docx)  [文本型PDF有效]

前端对接（Vue 3 fetch 示例）：
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/api/doc/word2pdf`, { method: 'POST', body: fd })
    const blob = await res.blob()
"""
import asyncio
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# ---------- 配置 ----------
MAX_FILE_SIZE = 50 * 1024 * 1024        # 50MB 上限
CONVERT_TIMEOUT = 120                   # LibreOffice 转换超时（秒）
ALLOWED_WORD_EXT = {".doc", ".docx"}
ALLOWED_PDF_EXT = {".pdf"}
TEMP_ROOT = Path(tempfile.gettempdir()) / "toolbox_convert"

# ---------- 应用 ----------
app = FastAPI(title="工具箱文档转换服务", version="1.0.0")

# CORS：允许前端（CF Pages 域名）跨域调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议收敛为具体域名，如 ["https://toolbox.pages.dev"]
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ---------- 工具函数 ----------
def _ensure_libreoffice() -> None:
    """检查 soffice 是否可用，缺失时给出安装指引"""
    if shutil.which("soffice") is None and shutil.which("libreoffice") is None:
        raise RuntimeError(
            "LibreOffice 未安装。请执行："
            "apt-get update && apt-get install -y libreoffice-writer libreoffice-impress"
        )


async def _run_convert(src: Path, out_dir: Path, target_format: str) -> Path:
    """
    调用 LibreOffice headless 转换。
    返回转换后的文件路径；失败抛异常。
    """
    _ensure_libreoffice()
    # 在独立 HOME 下运行，避免并行任务互相锁冲突
    home_dir = out_dir / "home"
    home_dir.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, "HOME": str(home_dir)}

    cmd = [
        "soffice", "--headless", "--norestore", "--nologo",
        "--convert-to", target_format,
        "--outdir", str(out_dir),
        str(src),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=CONVERT_TIMEOUT)
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(status_code=504, detail="转换超时，文件可能过大或格式复杂")

    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"LibreOffice 转换失败: {stderr.decode('utf-8', errors='ignore')[:500]}",
        )

    # 找到输出文件（与输入同名的目标格式文件）
    out_file = out_dir / f"{src.stem}.{target_format}"
    if not out_file.exists():
        # LibreOffice 输出后缀可能不同（如 pdf→docx 时），兜底搜索
        candidates = list(out_dir.glob(f"{src.stem}.*"))
        if not candidates:
            raise HTTPException(status_code=500, detail="转换完成但未找到输出文件")
        out_file = candidates[0]
    return out_file


async def _handle_convert(
    upload: UploadFile,
    allowed_ext: set,
    target_format: str,
    content_type: str,
) -> FileResponse:
    """通用转换处理：校验 → 保存 → 转换 → 返回（完成后自动清理）"""
    if upload.size and upload.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"文件超过 {MAX_FILE_SIZE // 1024 // 1024}MB 限制")

    ext = Path(upload.filename or "").suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"仅支持 {', '.join(sorted(allowed_ext))} 格式")

    # 创建本次任务独立目录
    task_id = uuid.uuid4().hex[:12]
    work_dir = TEMP_ROOT / task_id
    work_dir.mkdir(parents=True, exist_ok=True)

    src = work_dir / (f"input{ext}")
    try:
        # 流式写入，避免大文件占内存
        with open(src, "wb") as f:
            shutil.copyfileobj(upload.file, f, length=1024 * 1024)

        out_file = await _run_convert(src, work_dir, target_format)

        return FileResponse(
            path=str(out_file),
            media_type=content_type,
            filename=f"{Path(upload.filename).stem}_converted.{target_format}",
            headers={"X-Task-Id": task_id},
        )
    finally:
        # 清理任务目录（延迟 60s，确保文件流发送完成）
        async def _cleanup():
            await asyncio.sleep(60)
            shutil.rmtree(work_dir, ignore_errors=True)

        asyncio.create_task(_cleanup())


# ---------- 路由 ----------
@app.get("/health")
async def health():
    """健康检查（供监控/前端探测）"""
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    return {"status": "ok", "libreoffice": bool(soffice)}


@app.post("/api/doc/word2pdf")
async def word2pdf(file: UploadFile = File(...)):
    """Word → PDF"""
    return await _handle_convert(
        file, ALLOWED_WORD_EXT, "pdf", "application/pdf"
    )


@app.post("/api/doc/pdf2word")
async def pdf2word(file: UploadFile = File(...)):
    """PDF → Word（LibreOffice 对文本型 PDF 支持良好，扫描件效果有限）"""
    return await _handle_convert(
        file, ALLOWED_PDF_EXT, "docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
