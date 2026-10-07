<div align="center">

# ✦ Preact Dev Release Builder

**A local-first release workspace for curating commits, choosing a version, validating gates, and exporting publishable notes.**

![Preact](https://img.shields.io/badge/Preact-10-673ab8?style=for-the-badge&logo=preact&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=ffffff)
![Semver](https://img.shields.io/badge/Semver-7-15803d?style=for-the-badge&logo=semanticrelease&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

</div>

---

## ✨ Highlights

- **Commit Curation:** Searches, filters, includes, and excludes structured conventional commits.
- **Semver Suggestion:** Proposes a patch, minor, or major release from the selected fixes, features, and breaking changes.
- **Editable Metadata:** Controls the target version, release channel, date, and summary.
- **Breaking Change Focus:** Pulls incompatible changes into a dedicated warning section.
- **Release Preview:** Groups selected commits into readable feature, fix, performance, documentation, refactor, maintenance, and test sections.
- **Contributor Rollup:** Deduplicates contributors from the exact selected commit set.
- **Release Gates:** Tracks CI, migration, security, canary, and rollback readiness.
- **Commit Import:** Parses a documented pipe-delimited conventional-commit text format.
- **Useful Exports:** Downloads Markdown release notes and the complete JSON workspace.
- **Responsive Workflow:** Uses side-by-side curation and preview on desktop with focused Changes, Preview, and Gates views on compact screens.

## 🧱 Project Structure

```text
public/
|-- favicon.svg
|-- sample-commits.txt
`-- sample-release-workspace.json
src/
|-- app.tsx
|-- main.tsx
|-- index.css
|-- components/
|   |-- commit-list.tsx
|   |-- readiness-panel.tsx
|   |-- release-preview.tsx
|   `-- workspace-state.tsx
|-- domain/
|   `-- release.ts
`-- services/
    `-- release-store.ts
```

## 🛠️ Tech Stack

- Preact 10 with Vite 8
- TypeScript 6
- Tailwind CSS 4
- `semver` for release suggestions
- `Fuse.js` for commit search
- `zod`, `idb-keyval`, `@preact/signals`, and `lucide-preact`

## 📦 Included Sample Data

`public/sample-release-workspace.json` contains ten fictional commits, four contributors, one breaking change, mixed inclusion states, and five release gates. `public/sample-commits.txt` is ready for testing the importer.

Import lines use this format:

```text
hash type(scope)!: subject|Author Name|author@example.dev|ISO timestamp
```

## 🚀 Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 🔌 Extension Notes & Nuances

- All curation, generation, import, export, and persistence happen in the browser.
- Semver suggestions are deterministic hints. The target version remains editable because release policy can require a different choice.
- A breaking commit is shown both in the warning section and its conventional category by design.
- Imported commit files replace the commit set but preserve release metadata and readiness gates.
- The GitHub compare link is derived from the sample repository and version fields; replace the repository before using it for a real release.
- IndexedDB stores the current draft locally and invalid persisted data falls back to the bundled sample.

## 🧪 Build & Checks

```bash
npm run format:check
npm run build
npm run preview
```

## 🌐 Vercel Deployment

The repository includes a Vite-ready `vercel.json` with SPA rewrites.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📄 License

MIT License. See [LICENSE](./LICENSE).
