# Commit Guidelines

Use conventional-style commit messages and keep each commit focused on one area.

## Recommended Types

- `feat` - new functionality
- `fix` - bug fixes
- `docs` - documentation only
- `chore` - maintenance or tooling changes
- `refactor` - code reshaping without behavior change
- `test` - tests only

## Suggested Scope

- `backend` - API, services, middleware, jobs, database integration
- `frontend` - React views, components, UI state, client API calls
- `db` - schema or migration changes
- `docs` - README, setup notes, contributor guidance

## Good Patterns

- One commit for one backend feature.
- One commit for one frontend feature.
- One commit for database migrations.
- One commit for docs or config cleanup.

## Examples

```text
feat(backend): add admin notification endpoint
fix(frontend): prevent duplicate form submission
chore(db): update migration for product status
docs(docs): expand setup instructions
```

## Avoid

- Mixing backend and frontend logic in the same commit unless the change is intentionally cross-cutting.
- Using vague messages like `update`, `fix stuff`, or `changes`.
- Putting secrets, `.env` files, or generated dependencies into git.