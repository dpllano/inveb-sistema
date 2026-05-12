#!/usr/bin/env python3
"""
check_vite_env_vars.py - detecta uso de variables `import.meta.env.VITE_*`
no declaradas en `.env.example`.

Regresion del bug PR #25:
- `DetalleForm.tsx:15` y `CalculoHCModal.tsx:11` usaban `VITE_API_BASE_URL`
  (no existe en .env). En produccion caian al fallback `localhost` y todos
  los listboxes del modal "Crear Detalle" quedaban vacios.
- Este script habria cazado el drift antes de mergear.

Exit codes:
  0 - todas las VITE_* del codigo estan declaradas en .env.example
  1 - hay drift (alguna VITE_* usada sin declarar) o falta .env.example

Uso:
  python scripts/check_vite_env_vars.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = REPO_ROOT / "frontend"
SRC_DIR = FRONTEND_DIR / "src"
ENV_EXAMPLE = FRONTEND_DIR / ".env.example"

USAGE_RE = re.compile(r"import\.meta\.env\.(VITE_[A-Z0-9_]+)")
DECLARED_RE = re.compile(r"^\s*(VITE_[A-Z0-9_]+)\s*=", re.MULTILINE)


def collect_used_vars() -> dict[str, list[str]]:
    """Mapea VITE_* -> lista de archivos donde se usa."""
    used: dict[str, list[str]] = {}
    for path in SRC_DIR.rglob("*"):
        if path.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for match in USAGE_RE.finditer(text):
            var = match.group(1)
            rel = str(path.relative_to(REPO_ROOT))
            used.setdefault(var, []).append(rel)
    return used


def collect_declared_vars() -> set[str]:
    """Vars declaradas en .env.example."""
    if not ENV_EXAMPLE.exists():
        return set()
    text = ENV_EXAMPLE.read_text(encoding="utf-8")
    return set(DECLARED_RE.findall(text))


def main() -> int:
    if not ENV_EXAMPLE.exists():
        print(f"ERROR: no existe {ENV_EXAMPLE.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1

    used = collect_used_vars()
    declared = collect_declared_vars()

    undeclared = {var: files for var, files in used.items() if var not in declared}

    print(f"Vars VITE_* usadas en codigo:    {len(used)}")
    print(f"Vars VITE_* declaradas en env:   {len(declared)}")
    print(f"Vars sin declarar:               {len(undeclared)}")

    if undeclared:
        print("\nDRIFT DETECTADO - las siguientes vars se usan en codigo pero NO estan en .env.example:")
        for var, files in sorted(undeclared.items()):
            print(f"\n  {var}")
            for f in sorted(set(files)):
                print(f"    - {f}")
        print(
            "\nFix: agregar la var a frontend/.env.example O renombrar su uso para "
            "que coincida con una var ya declarada (ej. VITE_API_URL)."
        )
        return 1

    unused = declared - set(used.keys())
    if unused:
        print(f"\nWarning: {len(unused)} vars declaradas pero no usadas en codigo: {sorted(unused)}")

    print("\nOK - todas las VITE_* usadas en codigo estan declaradas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
