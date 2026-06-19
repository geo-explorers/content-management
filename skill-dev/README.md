# skill-dev — maintainer tooling

Developer-facing tools for **building** Geo skills. **Not shipped to editors** — editors only pull `../skills/`.

- **`skill-quality-check/`** — the Agent Skill authoring **standard** + a linter that checks a skill against it (dangling references, frontmatter, missing evals/ToC, weak descriptions). Form/quality only; it never judges domain content.

Run it before adding or editing anything under `../skills/`:

```bash
python3 skill-dev/skill-quality-check/scripts/check_skill.py skills/non-actionable/geo-query --format table
```

The full rule set is in `skill-quality-check/references/skill-quality-standard.md` — treat it as the standard for skill development in this repo.
