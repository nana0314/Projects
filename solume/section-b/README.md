# Section B — Tree Kawaiiness Algorithm

## Problem

Given a tree with `n` nodes and integer `k`, compute the **kawaiiness** — the sum over all possible roots `r` of `f(r)`, where `f(r)` is the number of distinct nodes that can appear as the Lowest Common Ancestor (LCA) of some set of `k` nodes when the tree is rooted at `r`.

## How to Run

```bash
python solution.py < input.txt
```

Or with inline input:

```bash
echo "1
6 3
1 2
1 3
2 4
2 5
3 6" | python solution.py
# Expected output: 17
```

## Requirements

- Python 3.7+
- No external libraries

## Algorithm

**Key insight:** For a fixed root `r`, a node `v` can be the LCA of some `k`-node subset if and only if its subtree size (when rooted at `r`) is ≥ `k`. Proof: include `v` itself in the set plus any `k−1` descendants — the LCA is always `v`.

So: `f(r) = |{v : subtree_size_r(v) >= k}|`

**Rerooting in O(n):** Root the tree at node 1. For each node `v` with subtree size `sub[v]`, count the number of roots `r` where `subtree_size_r(v) >= k`:

| Root `r` location | subtree_size_r(v) | Count | Contributes if |
|---|---|---|---|
| Outside `sub[v]` | `sub[v]` | `n − sub[v]` | `sub[v] >= k` |
| `r = v` | `n` | `1` | always |
| Inside child `c` of `v` | `n − sub[c]` | `sub[c]` | `n − sub[c] >= k` |

**Total per node v:** `[sub[v]>=k]*(n−sub[v]) + 1 + Σ_children_c [n−sub[c]>=k]*sub[c]`

**Time complexity:** O(n) per test case. Uses iterative DFS to avoid Python's recursion limit.

## Verified Examples

| Input | Expected | Got |
|---|---|---|
| n=2, k=2 | 2 | ✓ 2 |
| n=5, k=3 (star) | 9 | ✓ 9 |
| n=6, k=3 | 17 | ✓ 17 |
| n=10, k=5 | 35 | — (edges not shown in PDF) |
