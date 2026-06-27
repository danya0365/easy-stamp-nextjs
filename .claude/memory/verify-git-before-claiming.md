---
name: verify-git-before-claiming
description: Always run git to verify commit/push state before claiming anything about it — I get this wrong
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 283a20fe-3754-423f-b973-53043e4451d9
---

Never assert that commits are "unpushed", "pending", or "not committed" without first running a git command to check (`git status -sb`, `git rev-list --left-right --count origin/<branch>...<branch>`). In this repo the harness commits/pushes automatically, so my mental tally of "N unpushed commits" is repeatedly WRONG — e.g. I claimed "~21 unpushed commits on develop" when it was 0 ahead / 0 behind.

**Why:** I lose track of harness-driven commit/push folding and state stale counts as fact, which misleads the user and erodes trust.

**How to apply:** Before any statement about git state (or offering to push/commit), run the check and quote the real numbers. If I haven't verified, don't mention pushing at all. Don't offer to "push unpushed commits" speculatively.
