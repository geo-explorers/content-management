#!/usr/bin/env python3
"""
package_claude_chat.py — build Claude Chat (claude.ai) upload bundles for skills.

Claude Chat installs a skill from a .zip that contains a single top-level folder
(named exactly like the skill's `name`) with SKILL.md at its root. This script
stages each skill, normalizes its frontmatter to the fields the claude.ai
uploader validates (`name`, `description`, and the open `metadata` object —
folding non-standard top-level keys such as `version`, `authors`, `tools`,
`compatibility` into `metadata`), drops dev-only files (evals/, caches,
.gitignore), and writes one .zip per skill.

Usage:
    python3 skills/package_claude_chat.py                 # all skills under skills/
    python3 skills/package_claude_chat.py non-actionable  # only that subtree
    python3 skills/package_claude_chat.py --out /tmp/out  # custom output dir

No third-party deps beyond PyYAML. Reproducible: run it again to rebuild.
"""
from __future__ import annotations
import argparse
import os
import re
import shutil
import zipfile

import yaml

# Non-standard top-level frontmatter keys are folded under `metadata` so the
# claude.ai uploader only ever sees name/description/metadata.
FOLD_INTO_METADATA = ["version", "authors", "author", "tools", "compatibility"]
EXCLUDE_DIRS = {"evals", "__pycache__", ".git", ".venv", "venv", "node_modules"}
EXCLUDE_FILES = {".gitignore", ".DS_Store"}
MAX_DESCRIPTION = 1024  # claude.ai hard limit


def split_frontmatter(text: str) -> tuple[str, str]:
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        raise ValueError("SKILL.md has no YAML frontmatter")
    return m.group(1), m.group(2)


def normalize_frontmatter(front: str, expected_name: str) -> str:
    data = yaml.safe_load(front) or {}
    if "name" not in data or "description" not in data:
        raise ValueError("frontmatter must define both `name` and `description`")
    if data["name"] != expected_name:
        raise ValueError(f"name '{data['name']}' != folder '{expected_name}'")
    if len(data["description"]) > MAX_DESCRIPTION:
        raise ValueError(
            f"description is {len(data['description'])} chars (> {MAX_DESCRIPTION})"
        )
    meta = data.get("metadata") or {}
    if not isinstance(meta, dict):
        meta = {"note": str(meta)}
    for key in FOLD_INTO_METADATA:
        if key in data:
            meta[key] = data[key]
    out = {"name": data["name"], "description": data["description"]}
    if meta:
        out["metadata"] = meta
    return yaml.safe_dump(
        out, sort_keys=False, allow_unicode=True, width=100000, default_flow_style=False
    ).rstrip() + "\n"


def is_skill_dir(path: str) -> bool:
    return os.path.isfile(os.path.join(path, "SKILL.md"))


def find_skills(base: str) -> list[str]:
    found = []
    for dirpath, dirnames, _ in os.walk(base):
        if is_skill_dir(dirpath):
            found.append(dirpath)
            dirnames[:] = []  # don't descend into a skill
    return sorted(found)


def build(skill_dir: str, out_dir: str, stage_root: str) -> str:
    name = os.path.basename(skill_dir.rstrip("/"))
    stage = os.path.join(stage_root, name)
    if os.path.exists(stage):
        shutil.rmtree(stage)
    for dirpath, dirnames, filenames in os.walk(skill_dir):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        rel = os.path.relpath(dirpath, skill_dir)
        target = stage if rel == "." else os.path.join(stage, rel)
        os.makedirs(target, exist_ok=True)
        for f in filenames:
            if f in EXCLUDE_FILES or f.endswith((".pyc", ".pyo")):
                continue
            shutil.copy2(os.path.join(dirpath, f), os.path.join(target, f))

    sk = os.path.join(stage, "SKILL.md")
    front, body = split_frontmatter(open(sk, encoding="utf-8").read())
    new_front = normalize_frontmatter(front, name)
    open(sk, "w", encoding="utf-8").write(f"---\n{new_front}---\n{body}")

    zpath = os.path.join(out_dir, f"{name}.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, dirnames, filenames in os.walk(stage):
            dirnames.sort()
            for f in sorted(filenames):
                full = os.path.join(dirpath, f)
                z.write(full, os.path.join(name, os.path.relpath(full, stage)))
    return zpath


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="Package skills into claude.ai upload zips.")
    ap.add_argument(
        "subtree", nargs="?", default="",
        help="optional subfolder under skills/ to limit to (e.g. non-actionable)",
    )
    ap.add_argument("--out", default=os.path.join(here, "dist", "claude-chat"))
    args = ap.parse_args()

    base = os.path.join(here, args.subtree) if args.subtree else here
    os.makedirs(args.out, exist_ok=True)
    stage_root = os.path.join(args.out, "_stage")
    os.makedirs(stage_root, exist_ok=True)

    skills = find_skills(base)
    if not skills:
        raise SystemExit(f"no skills (SKILL.md) found under {base}")
    for skill_dir in skills:
        try:
            z = build(skill_dir, args.out, stage_root)
            print(f"OK   {os.path.basename(skill_dir):26s} -> {z} ({os.path.getsize(z)} B)")
        except Exception as e:  # keep going; report the bad one
            print(f"FAIL {os.path.basename(skill_dir):26s} -> {e}")
    shutil.rmtree(stage_root, ignore_errors=True)
    print(f"\nBundles in {args.out}")


if __name__ == "__main__":
    main()
