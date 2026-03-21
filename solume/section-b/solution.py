import sys
from collections import defaultdict

input = sys.stdin.readline


def solve():
    n, k = map(int, input().split())

    if n == 1:
        # Edge case: single node, k must be 1, only root=1, f(1)=1
        for _ in range(n - 1):
            input()
        print(1)
        return

    adj = defaultdict(list)
    for _ in range(n - 1):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)

    # Iterative DFS to compute subtree sizes rooted at node 1.
    # Also records the parent of each node and children list.
    sub = [0] * (n + 1)
    parent = [0] * (n + 1)
    children = defaultdict(list)
    order = []  # BFS/DFS traversal order (root first)

    visited = [False] * (n + 1)
    stack = [1]
    visited[1] = True
    parent[1] = 0

    while stack:
        v = stack.pop()
        order.append(v)
        for u in adj[v]:
            if not visited[u]:
                visited[u] = True
                parent[u] = v
                children[v].append(u)
                stack.append(u)

    # Compute subtree sizes bottom-up (reverse BFS/DFS order)
    for v in order:
        sub[v] = 1
    for v in reversed(order):
        if parent[v]:
            sub[parent[v]] += sub[v]

    # For each node v, count roots r where subtree_size_r(v) >= k.
    #
    # Three cases depending on where r falls relative to v:
    #   1. r outside sub[v]  (n - sub[v] roots): subtree_size_r(v) = sub[v]
    #      Contributes (n - sub[v]) if sub[v] >= k.
    #   2. r = v             (1 root):            subtree_size_r(v) = n
    #      Always contributes 1 (since n >= k).
    #   3. r inside child c  (sub[c] roots):      subtree_size_r(v) = n - sub[c]
    #      Contributes sub[c] if n - sub[c] >= k.
    #
    # Total kawaiiness = sum of contributions over all nodes v.

    ans = 0
    for v in order:
        # Case 1
        if sub[v] >= k:
            ans += n - sub[v]
        # Case 2
        ans += 1
        # Case 3
        for c in children[v]:
            if n - sub[c] >= k:
                ans += sub[c]

    print(ans)


def main():
    t = int(input())
    for _ in range(t):
        solve()


main()
