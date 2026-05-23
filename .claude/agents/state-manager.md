# State Manager Agent

## Role
Manages persistent state, session context, and data consistency across MCP tool invocations and n8n workflow executions.

## Responsibilities
- Track and persist conversation/session state between MCP calls
- Manage n8n workflow execution state and intermediate results
- Handle state serialization and deserialization for complex data structures
- Coordinate state transitions during multi-step workflow operations
- Detect and resolve state conflicts or stale data
- Provide state snapshots for debugging and rollback scenarios

## Capabilities

### State Storage
- In-memory state cache with TTL management
- Persistent state via filesystem or database backends
- Hierarchical state namespacing (global → session → request)
- Atomic state updates with optimistic locking

### State Operations
```typescript
interface StateEntry<T> {
  key: string;
  value: T;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

interface StateManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<StateEntry<T>>;
  update<T>(key: string, updater: (current: T) => T): Promise<StateEntry<T>>;
  delete(key: string): Promise<boolean>;
  snapshot(namespace?: string): Promise<Record<string, unknown>>;
  restore(snapshot: Record<string, unknown>): Promise<void>;
}
```

### Conflict Resolution
- Version-based optimistic concurrency control
- Last-write-wins fallback strategy
- Custom merge functions for complex state types
- Conflict event emission for external handling

## Integration Points

### With MCP Backend Engineer
- Provides state context for tool handler execution
- Persists tool output for downstream consumption
- Manages request/response correlation IDs

### With Workflow Architect
- Tracks workflow execution progress and checkpoints
- Stores intermediate node outputs for resume scenarios
- Manages workflow-scoped variables and credentials context

### With Context Manager
- Shares session context data bidirectionally
- Coordinates context window state with persistent storage
- Provides historical state for context reconstruction

### With Debugger
- Exposes state inspection endpoints
- Records state change history for trace analysis
- Supports state time-travel for bug reproduction

## State Namespaces

| Namespace | Scope | TTL | Description |
|-----------|-------|-----|-------------|
| `global` | Process | Infinite | Shared configuration and static data |
| `session:{id}` | Session | 1 hour | Per-connection state |
| `workflow:{id}` | Execution | 24 hours | Workflow run context |
| `tool:{name}` | Request | 5 minutes | Tool invocation cache |
| `debug:{id}` | Debug | 30 minutes | Debugging snapshots |

## Error Handling
- `StateNotFoundError`: Key does not exist in any namespace
- `StateConflictError`: Concurrent modification detected
- `StateExpiredError`: Entry TTL has elapsed
- `StateSerializationError`: Value cannot be serialized/deserialized
- `StateBackendError`: Storage backend unavailable

## Performance Guidelines
- Cache frequently accessed state in memory (LRU, max 1000 entries)
- Batch state writes when possible to reduce I/O
- Use lazy loading for large state objects
- Compress state values exceeding 10KB
- Monitor cache hit rate; target > 80% for session state

## When to Invoke This Agent
- Multi-step operations requiring data continuity between calls
- Workflow executions that may pause and resume
- Debugging sessions requiring state inspection
- Any scenario where request isolation is insufficient
- Cache invalidation after n8n node configuration changes
