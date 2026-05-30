'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { dict, type DictKey } from '@/lib/i18n/dict'

export type Lang = 'en' | 'zh'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: DictKey) => string
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key) => dict[key].en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)
    if (match?.[1] === 'zh') setLangState('zh')
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    document.cookie = `lang=${l};path=/;max-age=31536000`
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (key) => dict[key][lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
