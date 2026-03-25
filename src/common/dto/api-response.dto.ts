export class ApiResponseDto<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string

  static ok<T>(data: T): ApiResponseDto<T> {
    const response = new ApiResponseDto<T>()
    response.success = true
    response.data = data
    response.timestamp = new Date().toISOString()
    return response
  }

  static fail(error: string): ApiResponseDto<null> {
    const response = new ApiResponseDto<null>()
    response.success = false
    response.error = error
    response.timestamp = new Date().toISOString()
    return response
  }
}
