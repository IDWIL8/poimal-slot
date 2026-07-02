export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')

export async function personFingerprint(name: string, team: string) {
  const normalized = `${name.trim().toLocaleLowerCase('ru')}|${team.trim().toLocaleLowerCase('ru')}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function secureToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes).map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 14)
}
