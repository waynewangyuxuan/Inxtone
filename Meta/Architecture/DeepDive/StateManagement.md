# State Management

> 状态管理方案

## Web GUI：React Query + Zustand

```typescript
// 服务端状态：React Query
// packages/web/src/hooks/useCharacters.ts
export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => api.characters.list(),
    staleTime: 1000 * 60  // 1分钟
  })
}

// 客户端状态：Zustand
// packages/web/src/stores/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean
  activeTab: string
  editorSettings: EditorSettings

  toggleSidebar: () => void
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeTab: 'characters',
  editorSettings: defaultEditorSettings,

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab })
}))
```

## TUI：简化状态

```typescript
// TUI 使用 React 内置状态 + Context
// packages/tui/src/context/AppContext.tsx
interface AppState {
  currentProject: Project | null
  currentScreen: Screen
  characters: Character[]
  chapters: Chapter[]
}

const AppContext = createContext<AppState>(null)

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 直接调用 Services
  useEffect(() => {
    const characters = StoryBibleService.getCharacters()
    dispatch({ type: 'SET_CHARACTERS', payload: characters })
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
```

## 状态分类

| 类型 | 存储位置 | 示例 |
|------|----------|------|
| **服务端状态** | React Query | 角色列表、章节内容 |
| **客户端状态** | Zustand | 侧边栏折叠、当前 Tab |
| **URL 状态** | Router | 当前页面、查询参数 |
| **表单状态** | React Hook Form | 编辑中的数据 |
