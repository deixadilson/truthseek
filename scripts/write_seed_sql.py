from pathlib import Path
import runpy
import io
import sys

buf = io.StringIO()
old = sys.stdout
sys.stdout = buf
runpy.run_path("scripts/seed_premises.py", run_name="__main__")
sys.stdout = old
sql = buf.getvalue()
Path("scripts/seed_premises.sql").write_text(sql, encoding="utf-8")
print(f"wrote {len(sql)} chars; has Não={('Não' in sql)}")
