export class ChatResponseDto {
  response: string
  threadId: string
  sources?: Array<{
    text: string
    score: number
    metadata: Record<string, any>
  }>
  timestamp: string
}
