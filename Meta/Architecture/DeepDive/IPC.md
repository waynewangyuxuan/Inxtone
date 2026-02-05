# IPC 通信架构

> 进程间通信设计

## 整体通信模型

```
┌─────────────┐         ┌─────────────┐
│   TUI App   │         │  Web GUI    │
│  (Ink/CLI)  │         │  (React)    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ Direct Import         │ HTTP/WebSocket
       │ (同进程)              │ (跨进程)
       │                       │
       └───────────┬───────────┘
                   │
           ┌───────┴───────┐
           │    Server     │
           │  (Fastify)    │
           │               │
           │  ┌─────────┐  │
           │  │ Services│  │
           │  └─────────┘  │
           │  ┌─────────┐  │
           │  │   DB    │  │
           │  └─────────┘  │
           └───────────────┘
```

## TUI 通信方式：Direct Import

TUI 和 Server 运行在**同一进程**，直接调用 Service 层：

```typescript
// packages/tui/src/App.tsx
import { StoryBibleService, WritingService } from '@inxtone/core'

function CharacterScreen() {
  // 直接调用，无网络开销
  const characters = StoryBibleService.getCharacters()
  return <CharacterList items={characters} />
}
```

**优点**: 零延迟、无序列化开销、简单可靠

**启动方式**:
```bash
inxtone              # TUI 模式，直接调用 Services
inxtone serve        # 同时启动 HTTP Server（为 Web GUI）
```

## Web GUI 通信方式：HTTP + WebSocket

### HTTP API（请求-响应）

```typescript
// packages/web/src/api/client.ts
const API_BASE = 'http://localhost:3456/api'

export const api = {
  characters: {
    list: () => fetch(`${API_BASE}/characters`).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/characters/${id}`).then(r => r.json()),
    create: (data: CreateCharacterInput) =>
      fetch(`${API_BASE}/characters`, {
        method: 'POST',
        body: JSON.stringify(data)
      }).then(r => r.json()),
  },
}
```

### WebSocket（实时更新）

```typescript
// 服务端：广播事件
eventBus.on('*', (event) => {
  wss.clients.forEach(client => {
    client.send(JSON.stringify(event))
  })
})

// 客户端：订阅更新
export function useRealtimeSync() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3456/ws')

    ws.onmessage = (event) => {
      const data: AppEvent = JSON.parse(event.data)
      switch (data.type) {
        case 'CHAPTER_SAVED':
          queryClient.invalidateQueries(['chapters', data.chapterId])
          break
      }
    }

    return () => ws.close()
  }, [])
}
```

## AI 流式响应

```typescript
// Server Side: SSE (Server-Sent Events)
fastify.get('/api/ai/stream', async (request, reply) => {
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')

  const stream = await AIService.streamGeneration(request.query)

  for await (const chunk of stream) {
    reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`)
  }

  reply.raw.write('data: [DONE]\n\n')
  reply.raw.end()
})

// Client Side: EventSource
export function useAIStream() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = (input: GenerationInput) => {
    setLoading(true)
    const source = new EventSource(`/api/ai/stream?${params}`)

    source.onmessage = (event) => {
      if (event.data === '[DONE]') {
        source.close()
        setLoading(false)
      } else {
        const { chunk } = JSON.parse(event.data)
        setOutput(prev => prev + chunk)
      }
    }
  }

  return { output, loading, generate }
}
```
