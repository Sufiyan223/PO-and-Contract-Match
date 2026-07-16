const API_URL_KEY = 'poContractMatch.apiUrl'
const API_KEY_KEY = 'poContractMatch.apiKey'

export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) ?? ''
}

export function setApiUrl(value: string): void {
  localStorage.setItem(API_URL_KEY, value)
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) ?? ''
}

export function setApiKey(value: string): void {
  localStorage.setItem(API_KEY_KEY, value)
}
