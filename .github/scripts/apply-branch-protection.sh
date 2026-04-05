#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   REPO="owner/repo" OWNER_LOGIN="prami25r" ./apply-branch-protection.sh
# Requires: gh auth login with admin access to the repository.

: "${REPO:?Set REPO=owner/repo}"
: "${OWNER_LOGIN:?Set OWNER_LOGIN=repository_owner_username}"


# Apply strict branch protection to main
# - PR required
# - 1 approval required
# - Dismiss stale reviews
# - Require conversation resolution
# - Require status checks
# - Enforce for admins
# - No force pushes
# - No deletions
# - Restrict pushes to owner only
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/main/protection" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='Security CI / dependency-audit (frontend)' \
  -f required_status_checks.contexts[]='Security CI / dependency-audit (backend)' \
  -f enforce_admins=true \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F required_pull_request_reviews.require_code_owner_reviews=true \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F required_pull_request_reviews.require_last_push_approval=true \
  -F required_conversation_resolution=true \
  -f restrictions.users[]="${OWNER_LOGIN}" \
  -f restrictions.teams[]='' \
  -f restrictions.apps[]='' \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F block_creations=true \
  -F required_linear_history=true

# Optional: disable auto-merge at repository level
gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}" \
  -f allow_auto_merge=false \
  -f delete_branch_on_merge=true

# Enable vulnerability alerts and automated security fixes
gh api --method PUT -H "Accept: application/vnd.github+json" "/repos/${REPO}/vulnerability-alerts"
gh api --method PUT -H "Accept: application/vnd.github+json" "/repos/${REPO}/automated-security-fixes"

echo "Applied branch protections and baseline security settings for ${REPO}."
