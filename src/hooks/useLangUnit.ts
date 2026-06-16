import { useTranslation } from "react-i18next";

export function useLangUnit(namespace?: string) {
  const { t, i18n } = useTranslation(namespace);
  return { t, i18n };
}
