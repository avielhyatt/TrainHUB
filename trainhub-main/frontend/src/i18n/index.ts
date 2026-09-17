import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import he from './locales/he.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

export const RTL_LANGUAGES = new Set(['he'])

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'he',
    supportedLngs: ['he', 'en', 'ru'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'trainhub_lang',
    },
  })

function applyDocumentDirection(lang: string) {
  const dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
}

applyDocumentDirection(i18n.resolvedLanguage || 'he')
i18n.on('languageChanged', applyDocumentDirection)

export default i18n
