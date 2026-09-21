# Local Development & Build Troubleshooting

This guide provides technical resolutions for errors encountered during local development, compilation, and testing of `apps/web`.

---

## 1. Local Development Server

### Issue: Port 3000 Collision ("Port 3000 is in use")
- **Cause**: Another development process or Node instance is holding port 3000.
- **Resolution**:
  - Run `next dev -p 3001` to start on port 3001.
  - Or terminate the conflicting process via PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
    ```

---

## 2. Compilation & TypeScript Checks

### Issue: TypeScript Errors (`npx tsc --noEmit` fails)
- **Check**: Run `npx tsc --noEmit` to locate the exact file and line number.
- **Resolution**: Verify that interfaces in `features/settings/types.ts` or component props match exact type definitions. Never introduce untyped `any` overrides.

### Issue: Tailwind CSS Style Glitches
- **Cause**: Tailwind CSS 4 PostCSS cache mismatch or missing utility class compilation.
- **Resolution**:
  - Delete `.next` cache directory:
    ```bash
    rm -rf .next
    ```
  - Restart development server with `npm run dev`.
