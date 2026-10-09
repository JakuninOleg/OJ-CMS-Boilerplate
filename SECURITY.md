# Security

Do not commit client credentials, real content exports or environment files. Use a new database, secret and storage credentials for every project. Report security issues privately to the repository owner.

## Dependency audit, 9 October 2026

`npm audit --omit=dev` reports six high-severity package entries for one underlying advisory: `braces` stack-exhaustion when parsing deeply nested patterns (GHSA-vfj7-8cjw-p6xm). The dependency chain is Payload S3 storage → cloud-storage → find-node-modules → findup-sync → micromatch → braces. The registry currently has no patched braces release. Dependency count is not the count of distinct vulnerabilities.

These dependencies locate modules using server-side patterns; OJ CMS does not accept user-defined glob patterns. This reduces the exposed attack surface, but is not a claim that the dependency is safe. Review the advisory and update the lockfile when an upstream fix is published. Do not use `npm audit fix --force`: the proposed incompatible downgrades break the CMS stack.

The template pins updated nodemailer, sass, esbuild, undici and dompurify versions. Re-run the dependency audit before each client deployment. No claim of a vulnerability-free production release is made.
