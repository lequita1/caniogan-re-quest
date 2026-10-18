import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import english from "./en.json";

let language = "fil";
try {
  language = localStorage.getItem("request-language") === "en" ? "en" : "fil";
} catch {
  /* Storage may be unavailable. */
}
i18n.use(initReactI18next).init({
  lng: language,
  fallbackLng: "fil",
  supportedLngs: ["fil", "en"],
  keySeparator: false,
  nsSeparator: false,
  resources: {
    en: { translation: english },
    fil: {
      translation: Object.fromEntries(
        Object.keys(english).map((key) => [key, key]),
      ),
    },
  },
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});
document.documentElement.lang = language;
i18n.on("languageChanged", (value) => {
  document.documentElement.lang = value;
  try {
    localStorage.setItem("request-language", value);
  } catch {
    /* The current page still uses the selected language. */
  }
});
export default i18n;
