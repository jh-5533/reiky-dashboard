import { cookies } from 'next/headers'
import { dict, type DictKey } from './dict'

export type Lang = 'en' | 'zh'

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies()
  return cookieStore.get('lang')?.value === 'zh' ? 'zh' : 'en'
}

export function t(lang: Lang, key: DictKey): string {
  return dict[key][lang]
}
