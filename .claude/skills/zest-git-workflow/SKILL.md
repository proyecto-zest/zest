---
name: zest-git-workflow
description: Zest git and pull request conventions — branch names, commit messages, PR size and description, review and merge. Use when creating branches, committing, opening a PR or merging.
---

# Zest git and PRs

Full rules: `support/skills/git-workflow.md`.

## Branches
`feature/<short-description>`, `fix/<short-description>`,
`chore/<short-description>`. Always branch off the latest `main`; do not stack
unrelated changes onto an existing feature branch.

## Commits
One logical change per commit. The message explains the **why** — the diff
already shows the what.

## Pull requests
- Small and reviewable: one feature or fix, not a batch of unrelated changes.
- The description says what changed and why, linking the related task.
- Before opening: it builds, lint passes, and tests pass locally.
- UI changes include a screenshot or short clip.
- At least one other person reviews before merging.

## Never
- Force-push to `main` or shared branches.
- Commit directly to `main` — everything goes through a PR, even small fixes.
- Merge with CI red "to unblock" without a human decision.
