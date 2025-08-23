# PRD Tracker

## Blocking Infrastructure Tasks

### npm ci dependency mismatch
- **Owner:** Cody
- **Problem:** `npm ci` fails because `package.json` and `package-lock.json` are out of sync.
- **Steps to Fix:**
  1. Remove existing `node_modules` directory.
  2. Run `npm install` to regenerate `package-lock.json`.
  3. Commit the updated lockfile.
  4. Verify the fix by running `npm ci` again.
