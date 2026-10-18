import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div
      className="language-switcher"
      role="group"
      aria-label="Wika / Language"
    >
      <button
        type="button"
        lang="fil"
        aria-pressed={i18n.resolvedLanguage === "fil"}
        onClick={() => i18n.changeLanguage("fil")}
      >
        Filipino
      </button>
      <button
        type="button"
        lang="en"
        aria-pressed={i18n.resolvedLanguage === "en"}
        onClick={() => i18n.changeLanguage("en")}
      >
        English
      </button>
    </div>
  );
}
