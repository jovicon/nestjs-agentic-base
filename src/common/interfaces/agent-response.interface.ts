export interface AgentResponse {
  text: string
  threadId: string
  sources?: AgentSource[]
}

export interface AgentSource {
  text: string
  score: number
  metadata: Record<string, any>
}
