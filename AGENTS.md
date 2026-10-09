# OJ CMS development

- This is one native Payload admin inside Next.js. Keep native authentication, collections, forms, versions and permissions. Do not create an alternate CRUD dashboard that talks to another admin.
- Brand tokens live in `src/components/cms/oj-admin.scss`; public branding lives in `src/oj.config.ts`. Do not put secrets in client-imported configuration.
- No client content, migrations from another client's DB, account credentials, media assets or analytics IDs belong in this template.
- Use isolated disposable databases for tests. Never run integration tests against a client's database.
- Retain administrator/editor server-side permission checks and media validation. Changes require type generation, import-map generation, lint, typecheck, tests and build.
- Public frontend, SEO rendering, leads and analytics are project-specific extensions. Do not ship placeholder business data or fabricated statistics.
- Keep environment files, local uploads and test results out of Git. Check SECURITY.md before deployment.
