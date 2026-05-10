---
name: git-release
description: Crea releases y changelogs consistentes revisando merged PRs, proponiendo version bump semver, y generando comandos gh release create listos para copiar. Úsalo cuando prepares un tag release para cualquiera de los proyectos.
license: MIT
---

# Git Release

Automatiza la creación de releases y changelogs.

## Flujo de trabajo

### 1. Revisar cambios desde el último tag

```bash
# Ver último tag
git describe --tags --abbrev=0

# Ver commits desde el último tag
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Ver merged PRs
gh pr list --state merged --limit 20
```

### 2. Determinar version bump (semver)

```
PATCH (1.0.0 → 1.0.1): bug fixes, hotfixes
MINOR (1.0.0 → 1.1.0): nuevas features, backward compatible
MAJOR (1.0.0 → 2.0.0): breaking changes
```

### 3. Generar changelog

Formato recomendado:
```markdown
## [1.1.0] - 2026-05-09

### Added
- Nueva feature (PR #123)

### Fixed
- Bug corregido (PR #122)

### Changed
- Refactor de módulo X (PR #121)
```

### 4. Crear tag y release

```bash
# Crear tag local
git tag v1.1.0
git push origin v1.1.0

# Crear release en GitHub (dry-run primero)
gh release create v1.1.0 \
  --title "v1.1.0" \
  --notes "## What's Changed

### Added
- Nueva feature (PR #123)

### Fixed
- Bug corregido (PR #122)" \
  --target main
```

### 5. Release desde rama específica

```bash
# Para releases de my-app
gh release create v1.0.0 --target main --title "my-app v1.0.0"

# Para releases de my-backend
gh release create v0.2.0 --target main --title "my-backend v0.2.0"
```

## Convenciones

- Tags con prefijo `v`: `v1.0.0`
- Changelog en `CHANGELOG.md` en la raíz del proyecto
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Releases apuntan a `main`
- Para monorepo, incluir nombre del proyecto en el título del release
