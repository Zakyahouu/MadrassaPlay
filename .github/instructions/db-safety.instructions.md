---
description: "Use when planning or executing database operations, migrations, index changes, or data cleanup. Emphasizes safety: no automatic DB changes, require explicit user approval, avoid destructive commands."
---
# Database Safety (Testing)

- Do not create, modify, or execute migrations or scripts that alter schema or indexes automatically.
- Do not run destructive DB commands (drop/delete/truncate) unless the user explicitly asks and confirms.
- Before suggesting any DB change, ask for explicit approval and confirm the target DB/collection.
- Prefer read-only checks; provide manual mongosh steps only when requested.
