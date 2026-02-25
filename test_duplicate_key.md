# 修复重复 Key 问题

## 问题描述
在代付任务大厅无限滚动时，出现了 React 重复 key 错误：
```
Encountered two children with the same key, `edd21b17-fd87-4a35-8107-5ad8c174857b`
```

## 问题原因
在加载更多数据时，新加载的数据可能与已有数据重复，导致 React 渲染时出现相同的 key。

## 解决方案

### 1. 添加去重机制
使用 `loadedOrderIds` Set 来追踪已加载的订单 ID，在追加新数据时过滤掉重复项。

### 2. 防止重复请求
使用 `isLoadingRef` ref 来防止同时发起多个加载请求。

### 3. 优化依赖项
使用 `offsetRef` ref 来存储当前 offset，避免在 useEffect 依赖项中包含 `offset` 和 `fetchAvailableTasks`，减少不必要的重新渲染。

## 代码修改

### 添加状态和 ref
```typescript
const [loadedOrderIds, setLoadedOrderIds] = useState<Set<string>>(new Set());
const isLoadingRef = useRef(false);
const offsetRef = useRef(offset);

useEffect(() => {
  offsetRef.current = offset;
}, [offset]);
```

### 修改 fetchAvailableTasks 函数
- 添加重复请求检查
- 在首次加载时重置 `loadedOrderIds`
- 在加载更多时过滤重复数据

### 修改滚动监听 useEffect
- 使用 `offsetRef` 而不是 `offset` 状态
- 简化依赖项，只包含必要的值

## 测试验证
需要测试：
1. 首次加载是否正常
2. 滚动加载更多是否正常
3. 快速滚动是否不会重复加载
4. 切换标签页后再切换回来是否正常
