import "server-only";

import type { FunctionTestCase } from "@/lib/problems";
import { expandedGraphTestSeeds } from "@/lib/expanded-graph-public";

const implementations: Record<string, { cpp17: string; python3: string }> = {
  "undirected-component-count": {
    cpp17: `class Solution { public: int countComponents(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>> g(n); for(auto& e:edges){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);} vector<char> seen(n);int count=0;for(int s=0;s<n;++s)if(!seen[s]){++count;queue<int> q;q.push(s);seen[s]=1;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(!seen[v])seen[v]=1,q.push(v);}}return count;} };`,
    python3: `class Solution:\n    def countComponents(self, nodeCount, edges, start, target, directed):\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges: graph[a].append(b); graph[b].append(a)\n        seen = set(); count = 0\n        for root in range(nodeCount):\n            if root in seen: continue\n            count += 1; seen.add(root); stack = [root]\n            while stack:\n                for v in graph[stack.pop()]:\n                    if v not in seen: seen.add(v); stack.append(v)\n        return count`,
  },
  "directed-path-exists": {
    cpp17: `class Solution { public: bool pathExists(int n, vector<vector<int>>& edges, int start, int target, bool directed) { vector<vector<int>> g(n);for(auto&e:edges){g[e[0]].push_back(e[1]);if(!directed)g[e[1]].push_back(e[0]);}vector<char>s(n);queue<int>q;q.push(start);s[start]=1;while(!q.empty()){int u=q.front();q.pop();if(u==target)return true;for(int v:g[u])if(!s[v])s[v]=1,q.push(v);}return false;} };`,
    python3: `class Solution:\n    def pathExists(self, nodeCount, edges, start, target, directed):\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges:\n            graph[a].append(b)\n            if not directed: graph[b].append(a)\n        seen = {start}; stack = [start]\n        while stack:\n            u = stack.pop()\n            if u == target: return True\n            for v in graph[u]:\n                if v not in seen: seen.add(v); stack.append(v)\n        return False`,
  },
  "unweighted-shortest-path-length": {
    cpp17: `class Solution { public: int shortestPathLength(int n, vector<vector<int>>& edges, int s, int t, bool directed) { vector<vector<int>>g(n);for(auto&e:edges){g[e[0]].push_back(e[1]);if(!directed)g[e[1]].push_back(e[0]);}vector<int>d(n,-1);queue<int>q;q.push(s);d[s]=0;while(!q.empty()){int u=q.front();q.pop();if(u==t)return d[u];for(int v:g[u])if(d[v]<0)d[v]=d[u]+1,q.push(v);}return -1;} };`,
    python3: `class Solution:\n    def shortestPathLength(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges:\n            graph[a].append(b)\n            if not directed: graph[b].append(a)\n        distance = [-1] * nodeCount; distance[start] = 0; q = deque([start])\n        while q:\n            u = q.popleft()\n            if u == target: return distance[u]\n            for v in graph[u]:\n                if distance[v] < 0: distance[v] = distance[u] + 1; q.append(v)\n        return -1`,
  },
  "undirected-cycle-check": {
    cpp17: `class Solution { public: bool hasUndirectedCycle(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);}vector<char>s(n);for(int r=0;r<n;++r)if(!s[r]){queue<pair<int,int>>q;q.push({r,-1});s[r]=1;while(!q.empty()){auto[u,p]=q.front();q.pop();for(int v:g[u])if(!s[v])s[v]=1,q.push({v,u});else if(v!=p)return true;}}return false;} };`,
    python3: `class Solution:\n    def hasUndirectedCycle(self, nodeCount, edges, start, target, directed):\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges: graph[a].append(b); graph[b].append(a)\n        seen = set()\n        for root in range(nodeCount):\n            if root in seen: continue\n            seen.add(root); stack = [(root, -1)]\n            while stack:\n                u, parent = stack.pop()\n                for v in graph[u]:\n                    if v not in seen: seen.add(v); stack.append((v, u))\n                    elif v != parent: return True\n        return False`,
  },
  "graph-bipartition-check": {
    cpp17: `class Solution { public: bool isBipartite(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);}vector<int>c(n,-1);for(int r=0;r<n;++r)if(c[r]<0){queue<int>q;q.push(r);c[r]=0;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(c[v]<0)c[v]=1-c[u],q.push(v);else if(c[v]==c[u])return false;}}return true;} };`,
    python3: `class Solution:\n    def isBipartite(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges: graph[a].append(b); graph[b].append(a)\n        color = [None] * nodeCount\n        for root in range(nodeCount):\n            if color[root] is not None: continue\n            color[root] = 0; q = deque([root])\n            while q:\n                u = q.popleft()\n                for v in graph[u]:\n                    if color[v] is None: color[v] = 1 - color[u]; q.append(v)\n                    elif color[v] == color[u]: return False\n        return True`,
  },
  "weighted-shortest-distance": {
    cpp17: `class Solution { public: int shortestDistance(int n, vector<vector<int>>& edges, int s, int t, bool) { vector<vector<pair<int,int>>>g(n);for(auto&e:edges){g[e[0]].push_back({e[1],e[2]});g[e[1]].push_back({e[0],e[2]});}const int INF=1e9;vector<int>d(n,INF);priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>>q;d[s]=0;q.push({0,s});while(!q.empty()){auto[du,u]=q.top();q.pop();if(du!=d[u])continue;if(u==t)return du;for(auto[v,w]:g[u])if(du+w<d[v])d[v]=du+w,q.push({d[v],v});}return -1;} };`,
    python3: `class Solution:\n    def shortestDistance(self, nodeCount, edges, start, target, directed):\n        import heapq\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, w in edges: graph[a].append((b, w)); graph[b].append((a, w))\n        distance = [float('inf')] * nodeCount; distance[start] = 0; heap = [(0, start)]\n        while heap:\n            d, u = heapq.heappop(heap)\n            if d != distance[u]: continue\n            if u == target: return d\n            for v, w in graph[u]:\n                if d + w < distance[v]: distance[v] = d + w; heapq.heappush(heap, (distance[v], v))\n        return -1`,
  },
  "directed-cycle-check": {
    cpp17: `class Solution { public: bool hasDirectedCycle(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);vector<int>in(n);for(auto&e:edges)g[e[0]].push_back(e[1]),++in[e[1]];queue<int>q;for(int i=0;i<n;++i)if(!in[i])q.push(i);int seen=0;while(!q.empty()){int u=q.front();q.pop();++seen;for(int v:g[u])if(--in[v]==0)q.push(v);}return seen!=n;} };`,
    python3: `class Solution:\n    def hasDirectedCycle(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        graph = [[] for _ in range(nodeCount)]; indegree = [0] * nodeCount\n        for a, b, *rest in edges: graph[a].append(b); indegree[b] += 1\n        q = deque(i for i, d in enumerate(indegree) if d == 0); visited = 0\n        while q:\n            u = q.popleft(); visited += 1\n            for v in graph[u]:\n                indegree[v] -= 1\n                if indegree[v] == 0: q.append(v)\n        return visited != nodeCount`,
  },
  "directed-network-delay": {
    cpp17: `class Solution { public: int networkDelay(int n, vector<vector<int>>& edges, int s, int, bool) { vector<vector<pair<int,int>>>g(n);for(auto&e:edges)g[e[0]].push_back({e[1],e[2]});const int INF=1e9;vector<int>d(n,INF);priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>>q;d[s]=0;q.push({0,s});while(!q.empty()){auto[du,u]=q.top();q.pop();if(du!=d[u])continue;for(auto[v,w]:g[u])if(du+w<d[v])d[v]=du+w,q.push({d[v],v});}int ans=0;for(int x:d){if(x==INF)return -1;ans=max(ans,x);}return ans;} };`,
    python3: `class Solution:\n    def networkDelay(self, nodeCount, edges, start, target, directed):\n        import heapq\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, w in edges: graph[a].append((b, w))\n        distance = [float('inf')] * nodeCount; distance[start] = 0; heap = [(0, start)]\n        while heap:\n            d, u = heapq.heappop(heap)\n            if d != distance[u]: continue\n            for v, w in graph[u]:\n                if d + w < distance[v]: distance[v] = d + w; heapq.heappush(heap, (distance[v], v))\n        return -1 if any(d == float('inf') for d in distance) else max(distance)`,
  },
  "dag-route-count": {
    cpp17: `class Solution { public: int countDagRoutes(int n, vector<vector<int>>& edges, int s, int t, bool) { const int M=1000000007;vector<vector<int>>g(n);vector<int>in(n);for(auto&e:edges)g[e[0]].push_back(e[1]),++in[e[1]];queue<int>q;for(int i=0;i<n;++i)if(!in[i])q.push(i);vector<int>dp(n);dp[s]=1;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u]){dp[v]=(dp[v]+dp[u])%M;if(--in[v]==0)q.push(v);}}return dp[t];} };`,
    python3: `class Solution:\n    def countDagRoutes(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        mod = 1_000_000_007; graph = [[] for _ in range(nodeCount)]; indegree = [0] * nodeCount\n        for a, b, *rest in edges: graph[a].append(b); indegree[b] += 1\n        q = deque(i for i, d in enumerate(indegree) if d == 0); ways = [0] * nodeCount; ways[start] = 1\n        while q:\n            u = q.popleft()\n            for v in graph[u]: ways[v] = (ways[v] + ways[u]) % mod; indegree[v] -= 1; q.append(v) if indegree[v] == 0 else None\n        return ways[target]`,
  },
  "minimum-edge-reversals": {
    cpp17: `class Solution { public: int minimumReversals(int n, vector<vector<int>>& edges, int s, int t, bool) { vector<vector<pair<int,int>>>g(n);for(auto&e:edges){g[e[0]].push_back({e[1],0});g[e[1]].push_back({e[0],1});}const int INF=1e9;vector<int>d(n,INF);deque<int>q;d[s]=0;q.push_front(s);while(!q.empty()){int u=q.front();q.pop_front();for(auto[v,w]:g[u])if(d[u]+w<d[v]){d[v]=d[u]+w;if(w)q.push_back(v);else q.push_front(v);}}return d[t]==INF?-1:d[t];} };`,
    python3: `class Solution:\n    def minimumReversals(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        graph = [[] for _ in range(nodeCount)]\n        for a, b, *rest in edges: graph[a].append((b, 0)); graph[b].append((a, 1))\n        inf = 10**18; dist = [inf] * nodeCount; dist[start] = 0; q = deque([start])\n        while q:\n            u = q.popleft()\n            for v, w in graph[u]:\n                if dist[u] + w < dist[v]:\n                    dist[v] = dist[u] + w\n                    if w: q.append(v)\n                    else: q.appendleft(v)\n        return -1 if dist[target] == inf else dist[target]`,
  },
  "course-order-feasibility": {
    cpp17: `class Solution { public: bool canFinishCourses(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);vector<int>in(n);for(auto&e:edges)g[e[0]].push_back(e[1]),++in[e[1]];queue<int>q;for(int i=0;i<n;++i)if(!in[i])q.push(i);int count=0;while(!q.empty()){int u=q.front();q.pop();++count;for(int v:g[u])if(--in[v]==0)q.push(v);}return count==n;} };`,
    python3: `class Solution:\n    def canFinishCourses(self, nodeCount, edges, start, target, directed):\n        from collections import deque\n        graph = [[] for _ in range(nodeCount)]; indegree = [0] * nodeCount\n        for a, b, *rest in edges: graph[a].append(b); indegree[b] += 1\n        q = deque(i for i, d in enumerate(indegree) if d == 0); count = 0\n        while q:\n            u = q.popleft(); count += 1\n            for v in graph[u]:\n                indegree[v] -= 1\n                if indegree[v] == 0: q.append(v)\n        return count == nodeCount`,
  },
  "fewest-neighbors-city": {
    cpp17: `class Solution { public: int cityWithFewestNeighbors(int n, vector<vector<int>>& edges, int, int limit, bool) { const int INF=1e9;vector<vector<int>>d(n,vector<int>(n,INF));for(int i=0;i<n;++i)d[i][i]=0;for(auto&e:edges)d[e[0]][e[1]]=d[e[1]][e[0]]=min(d[e[0]][e[1]],e[2]);for(int k=0;k<n;++k)for(int i=0;i<n;++i)for(int j=0;j<n;++j)if(d[i][k]<INF&&d[k][j]<INF)d[i][j]=min(d[i][j],d[i][k]+d[k][j]);int best=n+1,ans=-1;for(int i=0;i<n;++i){int c=0;for(int j=0;j<n;++j)if(i!=j&&d[i][j]<=limit)++c;if(c<=best)best=c,ans=i;}return ans;} };`,
    python3: `class Solution:\n    def cityWithFewestNeighbors(self, nodeCount, edges, start, target, directed):\n        inf = 10**18; d = [[inf] * nodeCount for _ in range(nodeCount)]\n        for i in range(nodeCount): d[i][i] = 0\n        for a, b, w in edges: d[a][b] = d[b][a] = min(d[a][b], w)\n        for k in range(nodeCount):\n            for i in range(nodeCount):\n                for j in range(nodeCount): d[i][j] = min(d[i][j], d[i][k] + d[k][j])\n        return min(range(nodeCount), key=lambda i: (sum(1 for j in range(nodeCount) if i != j and d[i][j] <= target), -i))`,
  },
  "largest-component-size": {
    cpp17: `class Solution { public: int largestComponentSize(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<char>s(n);int best=0;for(int i=0;i<n;++i)if(!s[i]){int count=0;vector<int>st{i};s[i]=1;while(!st.empty()){int u=st.back();st.pop_back();++count;for(int v:g[u])if(!s[v])s[v]=1,st.push_back(v);}best=max(best,count);}return best;} };`,
    python3: `class Solution:\n    def largestComponentSize(self, nodeCount, edges, start, target, directed):\n        graph=[[] for _ in range(nodeCount)]\n        for a,b in edges: graph[a].append(b);graph[b].append(a)\n        seen=set();best=0\n        for root in range(nodeCount):\n            if root in seen: continue\n            seen.add(root);stack=[root];count=0\n            while stack:\n                u=stack.pop();count+=1\n                for v in graph[u]:\n                    if v not in seen:seen.add(v);stack.append(v)\n            best=max(best,count)\n        return best`,
  },
  "graph-is-a-tree": {
    cpp17: `class Solution { public: bool isTree(int n, vector<vector<int>>& edges, int, int, bool) { if(n==0||edges.size()!=static_cast<size_t>(n-1))return false;vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<char>s(n);queue<int>q;q.push(0);s[0]=1;int count=0;while(!q.empty()){int u=q.front();q.pop();++count;for(int v:g[u])if(!s[v])s[v]=1,q.push(v);}return count==n;} };`,
    python3: `class Solution:\n    def isTree(self, nodeCount, edges, start, target, directed):\n        if nodeCount==0 or len(edges)!=nodeCount-1:return False\n        graph=[[] for _ in range(nodeCount)]\n        for a,b in edges:graph[a].append(b);graph[b].append(a)\n        seen={0};stack=[0]\n        while stack:\n            for v in graph[stack.pop()]:\n                if v not in seen:seen.add(v);stack.append(v)\n        return len(seen)==nodeCount`,
  },
  "number-of-provinces": {
    cpp17: `class Solution { public: int countProvinces(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<char>s(n);int c=0;for(int i=0;i<n;++i)if(!s[i]){++c;queue<int>q;q.push(i);s[i]=1;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(!s[v])s[v]=1,q.push(v);}}return c;} };`,
    python3: `class Solution:\n    def countProvinces(self, nodeCount, edges, start, target, directed):\n        graph=[[] for _ in range(nodeCount)]\n        for a,b in edges:graph[a].append(b);graph[b].append(a)\n        seen=set();count=0\n        for i in range(nodeCount):\n            if i in seen:continue\n            count+=1;seen.add(i);stack=[i]\n            while stack:\n                for v in graph[stack.pop()]:\n                    if v not in seen:seen.add(v);stack.append(v)\n        return count`,
  },
  "shortest-path-count": {
    cpp17: `class Solution { public: long long countShortestPaths(int n, vector<vector<int>>& edges, int s, int t, bool) { const long long M=1000000007;vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<int>d(n,-1);vector<long long>w(n);queue<int>q;q.push(s);d[s]=0;w[s]=1;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(d[v]<0)d[v]=d[u]+1,w[v]=w[u],q.push(v);else if(d[v]==d[u]+1)w[v]=(w[v]+w[u])%M;}return w[t];} };`,
    python3: `class Solution:\n    def countShortestPaths(self,nodeCount,edges,start,target,directed):\n        from collections import deque\n        g=[[] for _ in range(nodeCount)]\n        for a,b in edges:g[a].append(b);g[b].append(a)\n        d=[-1]*nodeCount;ways=[0]*nodeCount;d[start]=0;ways[start]=1;q=deque([start]);mod=1000000007\n        while q:\n            u=q.popleft()\n            for v in g[u]:\n                if d[v]<0:d[v]=d[u]+1;ways[v]=ways[u];q.append(v)\n                elif d[v]==d[u]+1:ways[v]=(ways[v]+ways[u])%mod\n        return ways[target]`,
  },
  "eventual-safe-vertex-count": {
    cpp17: `class Solution { public: int countSafeVertices(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>r(n);vector<int>out(n);for(auto&e:edges)r[e[1]].push_back(e[0]),++out[e[0]];queue<int>q;for(int i=0;i<n;++i)if(!out[i])q.push(i);int count=0;while(!q.empty()){int u=q.front();q.pop();++count;for(int v:r[u])if(--out[v]==0)q.push(v);}return count;} };`,
    python3: `class Solution:\n    def countSafeVertices(self,nodeCount,edges,start,target,directed):\n        from collections import deque\n        rev=[[] for _ in range(nodeCount)];out=[0]*nodeCount\n        for a,b in edges:rev[b].append(a);out[a]+=1\n        q=deque(i for i,x in enumerate(out) if x==0);count=0\n        while q:\n            u=q.popleft();count+=1\n            for v in rev[u]:\n                out[v]-=1\n                if out[v]==0:q.append(v)\n        return count`,
  },
  "strongly-connected-component-count": {
    cpp17: `class Solution { public: int countStrongComponents(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n),r(n);for(auto&e:edges)g[e[0]].push_back(e[1]),r[e[1]].push_back(e[0]);vector<char>seen(n);vector<int>order;for(int s=0;s<n;++s)if(!seen[s]){vector<pair<int,int>>st{{s,0}};seen[s]=1;while(!st.empty()){auto&[u,i]=st.back();if(i<(int)g[u].size()){int v=g[u][i++];if(!seen[v])seen[v]=1,st.push_back({v,0});}else order.push_back(u),st.pop_back();}}fill(seen.begin(),seen.end(),0);int c=0;for(auto it=order.rbegin();it!=order.rend();++it)if(!seen[*it]){++c;vector<int>st{*it};seen[*it]=1;while(!st.empty()){int u=st.back();st.pop_back();for(int v:r[u])if(!seen[v])seen[v]=1,st.push_back(v);}}return c;} };`,
    python3: `class Solution:\n    def countStrongComponents(self,nodeCount,edges,start,target,directed):\n        g=[[] for _ in range(nodeCount)];r=[[] for _ in range(nodeCount)]\n        for a,b in edges:g[a].append(b);r[b].append(a)\n        seen=set();order=[]\n        for root in range(nodeCount):\n            if root in seen:continue\n            seen.add(root);stack=[(root,0)]\n            while stack:\n                u,i=stack[-1]\n                if i<len(g[u]):\n                    v=g[u][i];stack[-1]=(u,i+1)\n                    if v not in seen:seen.add(v);stack.append((v,0))\n                else:order.append(u);stack.pop()\n        seen=set();count=0\n        for root in reversed(order):\n            if root in seen:continue\n            count+=1;seen.add(root);stack=[root]\n            while stack:\n                for v in r[stack.pop()]:\n                    if v not in seen:seen.add(v);stack.append(v)\n        return count`,
  },
  "minimum-spanning-tree-cost": {
    cpp17: `class Solution { public: long long minimumSpanningTreeCost(int n, vector<vector<int>>& edges, int, int, bool) { if(n==1)return 0;sort(edges.begin(),edges.end(),[](auto&a,auto&b){return a[2]<b[2];});vector<int>p(n),sz(n,1);iota(p.begin(),p.end(),0);function<int(int)>f=[&](int x){return p[x]==x?x:p[x]=f(p[x]);};long long cost=0;int used=0;for(auto&e:edges){int a=f(e[0]),b=f(e[1]);if(a!=b){if(sz[a]<sz[b])swap(a,b);p[b]=a;sz[a]+=sz[b];cost+=e[2];if(++used==n-1)return cost;}}return -1;} };`,
    python3: `class Solution:\n    def minimumSpanningTreeCost(self,nodeCount,edges,start,target,directed):\n        if nodeCount==1:return 0\n        p=list(range(nodeCount));size=[1]*nodeCount\n        def find(x):\n            while p[x]!=x:p[x]=p[p[x]];x=p[x]\n            return x\n        cost=used=0\n        for a,b,w in sorted(edges,key=lambda e:e[2]):\n            x=find(a);y=find(b)\n            if x!=y:\n                if size[x]<size[y]:x,y=y,x\n                p[y]=x;size[x]+=size[y];cost+=w;used+=1\n                if used==nodeCount-1:return cost\n        return -1`,
  },
  "cycle-rank": {
    cpp17: `class Solution { public: int independentCycleCount(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<char>s(n);int c=0;for(int i=0;i<n;++i)if(!s[i]){++c;vector<int>st{i};s[i]=1;while(!st.empty()){int u=st.back();st.pop_back();for(int v:g[u])if(!s[v])s[v]=1,st.push_back(v);}}return (int)edges.size()-n+c;} };`,
    python3: `class Solution:\n    def independentCycleCount(self,nodeCount,edges,start,target,directed):\n        g=[[] for _ in range(nodeCount)]\n        for a,b in edges:g[a].append(b);g[b].append(a)\n        seen=set();components=0\n        for i in range(nodeCount):\n            if i in seen:continue\n            components+=1;seen.add(i);stack=[i]\n            while stack:\n                for v in g[stack.pop()]:\n                    if v not in seen:seen.add(v);stack.append(v)\n        return len(edges)-nodeCount+components`,
  },
  "reachable-pair-count": {
    cpp17: `class Solution { public: long long reachablePairCount(int n, vector<vector<int>>& edges, int, int, bool) { vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]),g[e[1]].push_back(e[0]);vector<char>s(n);long long answer=0;for(int i=0;i<n;++i)if(!s[i]){long long count=0;vector<int>st{i};s[i]=1;while(!st.empty()){int u=st.back();st.pop_back();++count;for(int v:g[u])if(!s[v])s[v]=1,st.push_back(v);}answer+=count*(count-1)/2;}return answer;} };`,
    python3: `class Solution:\n    def reachablePairCount(self,nodeCount,edges,start,target,directed):\n        g=[[] for _ in range(nodeCount)]\n        for a,b in edges:g[a].append(b);g[b].append(a)\n        seen=set();answer=0\n        for i in range(nodeCount):\n            if i in seen:continue\n            seen.add(i);stack=[i];count=0\n            while stack:\n                u=stack.pop();count+=1\n                for v in g[u]:\n                    if v not in seen:seen.add(v);stack.append(v)\n            answer+=count*(count-1)//2\n        return answer`,
  },
  "directed-reachable-vertex-count": {
    cpp17: `class Solution { public: int countReachable(int n, vector<vector<int>>& edges, int start, int, bool) { vector<vector<int>>g(n);for(auto&e:edges)g[e[0]].push_back(e[1]);vector<char>s(n);vector<int>st{start};s[start]=1;int count=0;while(!st.empty()){int u=st.back();st.pop_back();++count;for(int v:g[u])if(!s[v])s[v]=1,st.push_back(v);}return count;} };`,
    python3: `class Solution:\n    def countReachable(self,nodeCount,edges,start,target,directed):\n        g=[[] for _ in range(nodeCount)]\n        for a,b in edges:g[a].append(b)\n        seen={start};stack=[start]\n        while stack:\n            for v in g[stack.pop()]:\n                if v not in seen:seen.add(v);stack.append(v)\n        return len(seen)`,
  },
};

const extraCases: Record<string, Array<{ name: string; input: { nodeCount: number; edges: number[][]; start: number; target?: number; directed: boolean }; expected: number | boolean }>> = {
  "undirected-component-count": [
    { name: "No vertices", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Every vertex isolated", input: { nodeCount: 5, edges: [], start: 0, target: 0, directed: false }, expected: 5 },
    { name: "One connected component", input: { nodeCount: 4, edges: [[0, 1], [1, 2], [2, 3]], start: 0, target: 0, directed: false }, expected: 1 },
    { name: "Large sparse graph", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: false }, expected: 1 },
  ],
  "directed-path-exists": [
    { name: "Start equals target", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: true }, expected: true },
    { name: "Reverse direction is unavailable", input: { nodeCount: 2, edges: [[0, 1]], start: 1, target: 0, directed: true }, expected: false },
    { name: "Undirected edge works both ways", input: { nodeCount: 2, edges: [[0, 1]], start: 1, target: 0, directed: false }, expected: true },
    { name: "Long directed chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: true }, expected: true },
  ],
  "unweighted-shortest-path-length": [
    { name: "Same endpoint", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Direct edge", input: { nodeCount: 3, edges: [[0, 2], [0, 1], [1, 2]], start: 0, target: 2, directed: false }, expected: 1 },
    { name: "Long path", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: false }, expected: 999 },
    { name: "Directed route respected", input: { nodeCount: 3, edges: [[0, 1], [2, 1]], start: 0, target: 2, directed: true }, expected: -1 },
  ],
  "undirected-cycle-check": [
    { name: "Empty graph", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: false },
    { name: "Cycle in disconnected component", input: { nodeCount: 5, edges: [[0, 1], [2, 3], [3, 4], [4, 2]], start: 0, target: 0, directed: false }, expected: true },
    { name: "Tree-shaped component", input: { nodeCount: 5, edges: [[0, 1], [0, 2], [0, 3], [3, 4]], start: 0, target: 0, directed: false }, expected: false },
    { name: "Long chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: false }, expected: false },
  ],
  "graph-bipartition-check": [
    { name: "No vertices", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: true },
    { name: "Isolated vertices", input: { nodeCount: 5, edges: [], start: 0, target: 0, directed: false }, expected: true },
    { name: "Odd cycle in a component", input: { nodeCount: 5, edges: [[0, 1], [1, 2], [2, 0], [3, 4]], start: 0, target: 0, directed: false }, expected: false },
    { name: "Long path", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: false }, expected: true },
  ],
  "weighted-shortest-distance": [
    { name: "Zero weight edge", input: { nodeCount: 3, edges: [[0, 1, 0], [1, 2, 5]], start: 0, target: 2, directed: false }, expected: 5 },
    { name: "Single vertex", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Longer route beats direct edge", input: { nodeCount: 4, edges: [[0, 3, 20], [0, 1, 4], [1, 2, 3], [2, 3, 2]], start: 0, target: 3, directed: false }, expected: 9 },
    { name: "Large sparse chain", input: { nodeCount: 200, edges: Array.from({ length: 199 }, (_, i) => [i, i + 1, 3]), start: 0, target: 199, directed: false }, expected: 597 },
  ],
  "directed-cycle-check": [
    { name: "No edges", input: { nodeCount: 3, edges: [], start: 0, target: 0, directed: true }, expected: false },
    { name: "Self loop", input: { nodeCount: 1, edges: [[0, 0]], start: 0, target: 0, directed: true }, expected: true },
    { name: "Cycle in disconnected component", input: { nodeCount: 5, edges: [[0, 1], [2, 3], [3, 4], [4, 2]], start: 0, target: 0, directed: true }, expected: true },
    { name: "Long acyclic chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: true }, expected: false },
  ],
  "directed-network-delay": [
    { name: "Single node", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: true }, expected: 0 },
    { name: "Multiple routes", input: { nodeCount: 4, edges: [[0, 1, 8], [0, 2, 2], [2, 1, 1], [1, 3, 2]], start: 0, target: 0, directed: true }, expected: 5 },
    { name: "Unreachable vertex", input: { nodeCount: 4, edges: [[0, 1, 2], [1, 2, 3]], start: 0, target: 0, directed: true }, expected: -1 },
    { name: "Zero weight", input: { nodeCount: 2, edges: [[0, 1, 0]], start: 0, target: 0, directed: true }, expected: 0 },
  ],
  "dag-route-count": [
    { name: "No route", input: { nodeCount: 3, edges: [[0, 1]], start: 0, target: 2, directed: true }, expected: 0 },
    { name: "Start is target", input: { nodeCount: 2, edges: [[0, 1]], start: 1, target: 1, directed: true }, expected: 1 },
    { name: "Several converging routes", input: { nodeCount: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [4, 3], [3, 5]], start: 0, target: 5, directed: true }, expected: 3 },
    { name: "Wide layered DAG", input: { nodeCount: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5]], start: 0, target: 5, directed: true }, expected: 4 },
  ],
  "minimum-edge-reversals": [
    { name: "No reversals needed", input: { nodeCount: 3, edges: [[0, 1], [1, 2]], start: 0, target: 2, directed: true }, expected: 0 },
    { name: "Unconnected endpoints", input: { nodeCount: 3, edges: [], start: 0, target: 2, directed: true }, expected: -1 },
    { name: "Same endpoint", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: true }, expected: 0 },
    { name: "Mixed orientations", input: { nodeCount: 5, edges: [[1, 0], [1, 2], [3, 2], [3, 4]], start: 0, target: 4, directed: true }, expected: 2 },
  ],
  "course-order-feasibility": [
    { name: "No courses", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: true }, expected: true },
    { name: "No dependencies", input: { nodeCount: 5, edges: [], start: 0, target: 0, directed: true }, expected: true },
    { name: "Self dependency", input: { nodeCount: 1, edges: [[0, 0]], start: 0, target: 0, directed: true }, expected: false },
    { name: "Long dependency chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 999, directed: true }, expected: true },
  ],
  "fewest-neighbors-city": [
    { name: "Zero distance budget", input: { nodeCount: 3, edges: [[0, 1, 1]], start: 0, target: 0, directed: false }, expected: 2 },
    { name: "Equal counts use greatest index", input: { nodeCount: 4, edges: [], start: 0, target: 10, directed: false }, expected: 3 },
    { name: "Budget includes exact distance", input: { nodeCount: 3, edges: [[0, 1, 4], [1, 2, 4]], start: 0, target: 4, directed: false }, expected: 2 },
    { name: "One vertex", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
  ],
  "largest-component-size": [
    { name: "Empty graph", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "All isolated", input: { nodeCount: 4, edges: [], start: 0, target: 0, directed: false }, expected: 1 },
    { name: "Uneven components", input: { nodeCount: 8, edges: [[0, 1], [1, 2], [2, 3], [4, 5]], start: 0, target: 0, directed: false }, expected: 4 },
    { name: "Large connected chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: false }, expected: 1_000 },
  ],
  "graph-is-a-tree": [
    { name: "Single vertex", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: true },
    { name: "Disconnected forest", input: { nodeCount: 4, edges: [[0, 1], [2, 3]], start: 0, target: 0, directed: false }, expected: false },
    { name: "Cycle with V minus one edges", input: { nodeCount: 4, edges: [[0, 1], [1, 2], [2, 0]], start: 0, target: 0, directed: false }, expected: false },
    { name: "Large path tree", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: false }, expected: true },
  ],
  "number-of-provinces": [
    { name: "Empty city set", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "All isolated cities", input: { nodeCount: 6, edges: [], start: 0, target: 0, directed: false }, expected: 6 },
    { name: "One province", input: { nodeCount: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], start: 0, target: 0, directed: false }, expected: 1 },
    { name: "Several components", input: { nodeCount: 1_000, edges: Array.from({ length: 500 }, (_, i) => [i * 2, i * 2 + 1]), start: 0, target: 0, directed: false }, expected: 500 },
  ],
  "shortest-path-count": [
    { name: "Same source and target", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: 1 },
    { name: "Unique shortest route", input: { nodeCount: 4, edges: [[0, 1], [1, 2], [2, 3]], start: 0, target: 3, directed: false }, expected: 1 },
    { name: "Longer routes do not count", input: { nodeCount: 5, edges: [[0, 4], [0, 1], [1, 2], [2, 4]], start: 0, target: 4, directed: false }, expected: 1 },
    { name: "Many equal shortest routes", input: { nodeCount: 8, edges: [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5], [4, 6], [4, 7]], start: 0, target: 5, directed: false }, expected: 3 },
  ],
  "eventual-safe-vertex-count": [
    { name: "Empty graph", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: true }, expected: 0 },
    { name: "Single self loop", input: { nodeCount: 1, edges: [[0, 0]], start: 0, target: 0, directed: true }, expected: 0 },
    { name: "Cycle with safe exit", input: { nodeCount: 4, edges: [[0, 1], [1, 0], [1, 2]], start: 0, target: 0, directed: true }, expected: 2 },
    { name: "Long chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: true }, expected: 1_000 },
  ],
  "strongly-connected-component-count": [
    { name: "Empty graph", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: true }, expected: 0 },
    { name: "One strongly connected component", input: { nodeCount: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], start: 0, target: 0, directed: true }, expected: 1 },
    { name: "Isolated vertices", input: { nodeCount: 5, edges: [], start: 0, target: 0, directed: true }, expected: 5 },
    { name: "Long directed chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: true }, expected: 1_000 },
  ],
  "minimum-spanning-tree-cost": [
    { name: "Single vertex", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Equal cost choices", input: { nodeCount: 3, edges: [[0, 1, 2], [1, 2, 2], [0, 2, 2]], start: 0, target: 0, directed: false }, expected: 4 },
    { name: "Zero cost edges", input: { nodeCount: 3, edges: [[0, 1, 0], [1, 2, 0], [0, 2, 5]], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Large chain", input: { nodeCount: 200, edges: Array.from({ length: 199 }, (_, i) => [i, i + 1, 1]), start: 0, target: 0, directed: false }, expected: 199 },
  ],
  "cycle-rank": [
    { name: "Empty graph", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Several components with cycles", input: { nodeCount: 7, edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [5, 6]], start: 0, target: 0, directed: false }, expected: 2 },
    { name: "Isolated vertices", input: { nodeCount: 5, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "Dense graph cycle rank", input: { nodeCount: 4, edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]], start: 0, target: 0, directed: false }, expected: 3 },
  ],
  "reachable-pair-count": [
    { name: "No vertices", input: { nodeCount: 0, edges: [], start: 0, target: 0, directed: false }, expected: 0 },
    { name: "One component", input: { nodeCount: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], start: 0, target: 0, directed: false }, expected: 10 },
    { name: "Components and isolated vertices", input: { nodeCount: 7, edges: [[0, 1], [1, 2], [3, 4]], start: 0, target: 0, directed: false }, expected: 4 },
    { name: "Large component", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: false }, expected: 499_500 },
  ],
  "directed-reachable-vertex-count": [
    { name: "Empty outgoing list", input: { nodeCount: 1, edges: [], start: 0, target: 0, directed: true }, expected: 1 },
    { name: "Cycle visits each vertex once", input: { nodeCount: 3, edges: [[0, 1], [1, 2], [2, 0]], start: 1, target: 0, directed: true }, expected: 3 },
    { name: "Incoming edge is not followed", input: { nodeCount: 4, edges: [[0, 1], [2, 1], [1, 3]], start: 1, target: 0, directed: true }, expected: 2 },
    { name: "Long directed chain", input: { nodeCount: 1_000, edges: Array.from({ length: 999 }, (_, i) => [i, i + 1]), start: 0, target: 0, directed: true }, expected: 1_000 },
  ],
};

export const expandedGraphReferences = Object.fromEntries(expandedGraphTestSeeds.map((seed) => [seed.slug, implementations[seed.slug]]));
export const expandedGraphSampleCases: Record<string, FunctionTestCase[]> = Object.fromEntries(expandedGraphTestSeeds.map((seed) => [seed.slug,
  seed.samples.map((sample, index) => ({ name: `Example ${index + 1}`, input: { kind: "graph" as const, nodeCount: sample.nodeCount, edges: sample.edges.map((edge) => [...edge]), start: sample.start, target: sample.target, directed: sample.directed }, expectedOutput: sample.expected, publicExampleIndex: index })),
]));
export const expandedGraphSubmissionCases: Record<string, FunctionTestCase[]> = Object.fromEntries(expandedGraphTestSeeds.map((seed) => [seed.slug, [
  ...seed.samples.map((sample, index) => ({ name: `Example ${index + 1}`, input: { kind: "graph" as const, nodeCount: sample.nodeCount, edges: sample.edges.map((edge) => [...edge]), start: sample.start, target: sample.target, directed: sample.directed }, expectedOutput: sample.expected, publicExampleIndex: index })),
  ...extraCases[seed.slug].map((testCase) => ({ name: testCase.name, input: { kind: "graph" as const, ...testCase.input }, expectedOutput: testCase.expected })),
]]));
