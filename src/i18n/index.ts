import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { HotUpdateBackend } from "./hotUpdateBackend";

const IS_DEBUG_LANG = import.meta.env.VITE_DEV_DEBUG_LANG === "true";

const PROD_LANGS = ["en", "de", "fr", "es", "it"];
const SUPPORTED_LANGS = IS_DEBUG_LANG ? [...PROD_LANGS, "zh-CN"] : PROD_LANGS;

const hotUpdateBackend = new HotUpdateBackend();

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: import.meta.env.DEV,
    supportedLngs: SUPPORTED_LANGS,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator", "htmlTag"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
      excludeCacheFor: IS_DEBUG_LANG ? [] : ["zh-CN"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

if (!IS_DEBUG_LANG && i18n.language === "zh-CN") {
  i18n.changeLanguage("en");
}

export function updateTranslations(locales: Record<string, Record<string, string>>) {
  Object.keys(locales).forEach((lng) => {
    if (SUPPORTED_LANGS.includes(lng)) {
      Object.keys(locales[lng]).forEach((ns) => {
        i18n.addResourceBundle(lng, ns, locales[lng][ns], true, true);
      });
    }
  });
}

export function useHotUpdateBackend() {
  return hotUpdateBackend;
}

export default i18n;
