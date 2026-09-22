# Continuous Integration (CI) Architecture

Rivo uses GitHub Actions to enforce code quality, database schema consistency, and security regressions on every code change.

## CI Workflow Pipeline

Every Pull Request and push to the `main` branch triggers `.github/workflows/ci.yml`:

1. **Clean Installation:** `npm ci` ensures deterministic dependency trees.
2. **Prisma Client Generation:** `npm run prisma:generate` verifies client types can be built without errors.
3. **Prisma Schema Validation:** `npm run prisma:validate` ensures `prisma/schema.prisma` contains no syntax or relational integrity errors.
4. **Static Code Analysis (Linting):** `npm run lint` executes ESLint rules across the web application.
5. **Integration & Security Test Matrix:** `npm test` runs:
   - 87-point Authentication & RBAC security test matrix (`test:auth`).
   - 19-point Multi-Tenant Sequential ID generator test suite (`test:id`).
6. **Production Build Compilation:** `npm run build` compiles Next.js pages and API route handlers to catch serverless runtime incompatibilities prior to deployment.

## Security Policies in CI

- **No Secret Exposure:** Real secrets are never echoed or dumped in CI logs.
- **Fail-Fast:** Any failure in linting, validation, testing, or building immediately blocks merging into `main`.
