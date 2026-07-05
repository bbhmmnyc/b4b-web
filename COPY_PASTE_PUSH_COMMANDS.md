# Copy/Paste Commands To Verify And Push

Run from `C:\Users\Jeffr\project_b4b\b4b-web`.

```powershell
# 1. Verify Python files compile.
$files = Get-ChildItem -Recurse -Filter *.py | Where-Object { $_.FullName -notmatch '\\.venv\\|\\.git\\' } | ForEach-Object { $_.FullName }
.\.venv\Scripts\python.exe -m py_compile $files

# 2. Verify backend imports from repo root.
$env:MONGO_URL='mongodb://localhost:27017/test'
$env:DB_NAME='test'
$env:JWT_SECRET='testsecret'
.\.venv\Scripts\python.exe -c "import server; print('root backend import ok')"

# 3. Verify backend imports from backend folder.
Push-Location backend
..\.venv\Scripts\python.exe -c "import server; print('backend import ok')"
Pop-Location

# 4. Verify frontend install, audit, and production build.
Push-Location frontend
npm install
npm audit
npm run build
Pop-Location

# 5. Verify Python dependency audit.
.\.venv\Scripts\pip-audit.exe -r backend\requirements.txt

# 6. Review local changes.
git status --short
git diff --stat

# 7. Commit and push after reviewing the diff.
git add .gitignore README.md CODE_AUDIT_FIXES.md COPY_PASTE_PUSH_COMMANDS.md package.json package-lock.json requirements.txt server.py backend frontend comments.py posts.py payments.py uploads
git commit -m "Fix backend startup and dependency issues"
git push
```

Notes:

- The frontend now builds with Vite and still writes production output to `frontend/build`.
- Files placed in `frontend/public` are copied into `frontend/build` and can be referenced with root-relative paths like `/b4b-logo.png`.
- The uploaded runtime images were removed from Git tracking only; they remain on your local disk.
