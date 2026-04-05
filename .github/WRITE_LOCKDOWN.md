# Public Read, Restricted Write Lockdown

This repository is intended to stay **publicly readable** while being **strictly write-protected**.

## Required GitHub repository settings

Configure these in **Settings → General / Access / Branches / Actions**:

1. **Repository visibility**
   - Keep repository visibility set to **Public**.

2. **Collaborator access audit**
   - Remove all users/teams that should not have write/admin rights.
   - Keep write/admin access only for explicitly trusted collaborators.

3. **Pull requests**
   - Require pull requests for all changes to the default branch.
   - Disable auto-merge.
   - Require at least **1 approval** before merge.
   - Dismiss stale approvals when new commits are pushed.
   - Optionally require status checks to pass before merge.

4. **Branch protection (default branch, e.g., `main`)**
   - Enable **Require a pull request before merging**.
   - Enable **Require approvals** (minimum 1).
   - Enable **Dismiss stale pull request approvals when new commits are pushed**.
   - Enable **Require status checks to pass before merging** (if CI is configured).
   - Enable **Restrict who can push to matching branches** and allow only owner/trusted collaborators.
   - Disable **Allow force pushes**.
   - Disable **Allow deletions**.

5. **Code owners**
   - Keep `.github/CODEOWNERS` with:
     - `* @prami25r`
   - In branch protection, enable **Require review from Code Owners**.

6. **GitHub Actions hardening (optional but recommended)**
   - Restrict Actions to trusted actions/workflows.
   - Disable or limit workflow runs from forks for sensitive workflows.

## Expected outcome

- Repository remains public for viewing and cloning.
- No direct commits to protected branches by unauthorized users.
- External contributions are limited to pull requests.
- Pull requests cannot merge without explicit trusted approval.
