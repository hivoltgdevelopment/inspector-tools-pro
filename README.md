# Inspector Tools Pro

Inspector Tools Pro is a Progressive Web App designed for professional home-watch inspectors.
It supports voice-to-form entry (English and Spanish), dynamic prompts per property type,
photo and video capture with timestamp and geo-tag, and offline-ready storage so
inspections can be completed without a network connection.

## GitHub Pages Deployment

This app is configured for GitHub Pages deployment with the following features:

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- GitHub Actions workflow builds and deploys the app
- Uses relative paths for GitHub Pages compatibility

### Manual Deployment
```bash
# Build for GitHub Pages
npm run build:gh-pages

# Deploy (if you have gh-pages installed)
npm run deploy
```

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - No branch selection needed (GitHub Actions will handle deployment)

2. **Configure Actions Permissions**:
   - Go to Settings → Actions → General
   - Enable "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests

3. **First Deployment**:
   - Push code to `main` branch
   - GitHub Actions will automatically build and deploy
   - App will be available at `https://hivoltgdevelopment.github.io/inspector-tools`

### PWA Features
- Fully configured for app store deployment
- Works offline with service worker
- Installable on mobile devices
- All app store metadata included

### Development
```bash
npm install
npm run dev
```

#### Skipping SMS login during development

Create a `.env` file and set `VITE_SKIP_AUTH=true` to bypass the SMS authentication flow and render the protected screens directly.

To surface the placeholder payments UI, add `VITE_PAYMENTS_ENABLED=true` to your `.env` file.

### Build
```bash
npm run build        # Standard build
npm run build:gh-pages  # GitHub Pages build with relative paths
```

## CI/CD

This repo includes two GitHub Actions workflows under `.github/workflows`:

- `deploy.yml`: Builds and deploys the app to GitHub Pages on every push to `main`.
- `rc-release.yml`: Creates a Release Candidate tag and a draft GitHub Release via manual dispatch.

### Required Settings

- Settings → Actions → General:
  - Set Workflow permissions to “Read and write permissions”.

### Repository Variables (Recommended)

Add the following repository Variables (Settings → Variables → Actions) so builds don’t fail when secrets are not provided:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SKIP_AUTH` (e.g., `false` in production)
- `VITE_SKIP_RBAC` (e.g., `false` in production)

These are injected during the Pages build step to provide safe defaults. For production, set appropriate values/secrets.

### GitHub Pages Deploy

- Trigger: push to `main`.
- Concurrency guard prevents overlapping runs.
- Uses `npm ci --prefer-offline` and builds with `npm run build:gh-pages`.

### RC Release Workflow

- Trigger: Actions → RC Release → Run workflow → provide `tag` (e.g., `v1.0.0-rc.1`).
- The workflow:
  - Validates the tag input
  - Installs Node and dependencies
  - Creates and pushes the tag with the GitHub Actions token
  - Creates a draft GitHub Release for that tag

## PR Workflow

For new changes, prefer a PR-based flow:

```bash
git checkout -b feature/my-change
# make commits
git push -u origin feature/my-change
# open PR via GitHub UI or `gh pr create`
```

Mainline production changes should merge via reviewed PRs with passing checks.
