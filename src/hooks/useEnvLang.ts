export function useEnvLang() {
  const isDebugLang = import.meta.env.VITE_DEV_DEBUG_LANG === "true";
  return { isDebugLang };
}
