# GitHub Pages Setup Instructions

## Repository Settings Configuration

### 1. Enable GitHub Pages
1. Go to your repository: https://github.com/hivoltgdevelopment/inspector-tools
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### 2. Configure GitHub Actions Permissions
1. In your repository, go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

### 3. Environment Variables (if needed)
If your app uses environment variables:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets for any environment variables
3. Update the workflow file to use these secrets

### 4. Custom Domain (Optional)
If you want to use a custom domain:
1. In **Settings** → **Pages**
2. Enter your custom domain in the **Custom domain** field
3. Add a CNAME file to your repository root

### 5. Deployment Status
- Your app will be available at: https://hivoltgdevelopment.github.io/inspector-tools/
- Check deployment status in the **Actions** tab
- First deployment may take 5-10 minutes

### 6. Branch Protection (Recommended)
1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select the GitHub Pages deployment check

## Troubleshooting
- If deployment fails, check the Actions tab for error logs
- Ensure all dependencies are properly listed in package.json
- Verify that the build completes successfully locally first