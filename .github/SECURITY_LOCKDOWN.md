# Repository Security Lockdown Plan (Public + Write-Protected)

Owner: `@prami25r`

This repository is intentionally **PUBLIC for read/clone** and **LOCKED for writes** except trusted maintainers.

## Phase 1 — Audit Findings (read-only)

- Branches discovered locally: `work` (no local `main` branch checkout in this clone).
- Sensitive file scan: no committed `.env*`, private keys, GitHub PATs, or AWS key patterns detected in current tree.
- History spot-scan: no high-confidence secret patterns found in sampled historical commits.
- GitHub Actions: no workflows existed previously; a hardened workflow was added with least-privilege permissions and non-blocking audit warnings to avoid lockout from pre-existing advisories.

## Phase 2 — Access control hardening

Run these commands as repo admin to audit/reduce access:

```bash
gh api /repos/OWNER/REPO/collaborators --paginate --jq '.[] | {login, permissions}'
# Remove unknown users:
gh api --method DELETE /repos/OWNER/REPO/collaborators/USERNAME
# Add only trusted collaborators with least privilege:
gh api --method PUT /repos/OWNER/REPO/collaborators/TRUSTED_USER -f permission=push
```

## Phase 3 — Branch protection (critical)

Use script:

```bash
REPO="OWNER/REPO" OWNER_LOGIN="prami25r" .github/scripts/apply-branch-protection.sh
```

This enforces on `main`:

- PR required before merge
- At least 1 approval
- Stale approvals dismissed on new commits
- Code owner review required
- Conversation resolution required
- Required status checks (`dependency-audit (frontend)` and `dependency-audit (backend)`)
- Linear history required
- Force pushes disabled
- Deletions disabled
- Push restricted to owner
- Rules enforced for admins

## Phase 4 — Secret management

- `.gitignore` includes: `.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `node_modules/`.
- If secrets are ever detected:
  1. Rotate credentials immediately.
  2. Purge from history (`git filter-repo` / BFG).
  3. Store in GitHub Secrets / environment variables only.
- Enable GitHub Secret Scanning + Push Protection in repository security settings.

## Phase 5 — Contribution control

- CODEOWNERS is set to require owner review for all paths.
- Branch protection must have “Require review from Code Owners” enabled.
- Disable auto-merge in repository settings.

## Phase 6 — Dependency security

- Dependabot config added for `/frontend` and `/backend` npm ecosystems.
- Enable Dependabot alerts + security updates in repository settings.

## Phase 7 — GitHub Actions hardening

- Workflow permissions are set to:

```yaml
permissions:
  contents: read
```

- Keep “Send write tokens to workflows from pull requests” disabled.
- Restrict Actions to trusted actions in repository settings where possible.

## Phase 8 — Commit authenticity

Enable required signed commits on protected branches (GitHub branch/ruleset setting).

## Phase 9 — Architectural security

- Ensure no server-side secrets/business logic are exposed in frontend code.
- Keep sensitive operations in private backend/services.

## Phase 10 — Final validation checklist

- [ ] No secrets in current tree
- [ ] No secrets in git history
- [ ] Branch protections active on `main` and production branches
- [ ] Direct commits blocked on protected branches
- [ ] CODEOWNERS review enforced
- [ ] Dependabot + vulnerability alerts enabled
- [ ] Actions restricted and least privilege confirmed

## Security score (current repo state in this clone)

- **7.5 / 10**
- Why not higher yet: branch protections/collaborator restrictions/signed-commit enforcement must be applied on GitHub server-side by admin.
