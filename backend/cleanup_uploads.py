#!/usr/bin/env python3
"""
数字工具箱 - 临时文件定时清理脚本
====================================
每隔 10 分钟扫描后端临时上传/转换目录，彻底删除生成超过 15 分钟的
Word/PDF/中间文件，确保不留用户隐私。

用法：
    python3 cleanup_uploads.py                 # 正式清理
    python3 cleanup_uploads.py --dry-run       # 演练模式（只打印不删除）
    python3 cleanup_uploads.py --dir /path     # 指定目录（默认读环境变量 TOOLBOX_TEMP_DIR）

crontab 配置（每 10 分钟执行一次）：
    */10 * * * * /usr/bin/python3 /opt/toolbox-backend/cleanup_uploads.py >> /var/log/toolbox-cleanup.log 2>&1

说明：
    - 只删除超过 MAX_AGE（默认 15 分钟）的条目，正在转换的任务目录（新生成）不受影响
    - 目录与文件都会清理；清理失败（权限/占用）会自动跳过，不中断
    - 输出日志格式：时间戳 + 本次清理统计，便于排障
"""

import argparse
import os
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------- 配置 ----------
DEFAULT_TMP_DIR = Path(os.environ.get("TOOLBOX_TEMP_DIR", "/var/lib/toolbox-backend/tmp"))
DEFAULT_MAX_AGE = 15 * 60  # 15 分钟（秒）


def log(msg: str) -> None:
    """带时间戳的日志输出（stderr 也保留一份，便于 crontab 捕获）"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)


def clean(tmp_dir: Path, max_age: int, dry_run: bool = False) -> int:
    """扫描并清理超龄文件/目录。返回清理的条目数。"""
    now = time.time()
    removed_files = 0
    removed_dirs = 0
    skipped = 0

    if not tmp_dir.exists():
        log(f"目录不存在，跳过: {tmp_dir}")
        return 0

    for entry in tmp_dir.iterdir():
        try:
            stat = entry.stat()
        except OSError:
            skipped += 1
            continue

        age = now - stat.st_mtime
        if age <= max_age:
            continue  # 还在 15 分钟内，可能是正在处理的任务

        try:
            if dry_run:
                log(f"[DRY-RUN] 将删除: {entry.name} (age={int(age)}s, {'dir' if entry.is_dir() else 'file'})")
            elif entry.is_dir():
                shutil.rmtree(entry, ignore_errors=True)
                removed_dirs += 1
            else:
                entry.unlink(missing_ok=True)
                removed_files += 1
        except OSError as e:
            log(f"清理失败，跳过: {entry.name} ({e})")
            skipped += 1

    log(
        f"清理完成: 删除文件 {removed_files} 个, 目录 {removed_dirs} 个"
        f"{', 跳过 ' + str(skipped) + ' 个' if skipped else ''}"
        f" (dry-run={dry_run})"
    )
    return removed_files + removed_dirs


def main() -> int:
    parser = argparse.ArgumentParser(description="工具箱临时文件清理（每 10 分钟运行一次）")
    parser.add_argument("--dir", type=str, default=str(DEFAULT_TMP_DIR), help="临时目录路径")
    parser.add_argument("--max-age", type=int, default=DEFAULT_MAX_AGE, help="超过多少秒删除（默认 900）")
    parser.add_argument("--dry-run", action="store_true", help="演练模式，只打印不删除")
    args = parser.parse_args()

    log(f"开始清理: dir={args.dir}, max_age={args.max_age}s, dry_run={args.dry_run}")
    try:
        clean(Path(args.dir), args.max_age, args.dry_run)
    except Exception as e:
        log(f"发生异常: {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
