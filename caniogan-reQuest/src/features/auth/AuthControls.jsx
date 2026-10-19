import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { TextField } from "../../components/ui";

export function PasswordField(props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <TextField {...props} type={visible ? "text" : "password"} />
      <button
        className="text-button"
        type="button"
        aria-pressed={visible}
        aria-controls={props.id}
        aria-label={`${t(visible ? "Itago ang password" : "Ipakita ang password")} (${props.label})`}
        onClick={() => setVisible(!visible)}
      >
        {t(visible ? "Itago ang password" : "Ipakita ang password")}
      </button>
    </div>
  );
}

export function FormErrors({ errors }) {
  const { t } = useTranslation();
  const summary = useRef(null);
  useEffect(() => {
    if (errors) summary.current?.focus();
  }, [errors]);
  if (!errors) return null;
  return (
    <div className="form-errors" role="alert" tabIndex="-1" ref={summary}>
      <h2>{t("May kailangang ayusin")}</h2>
      <ul>
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>
            {field === "form" ? (
              t(message)
            ) : (
              <a href={`#${field}`}>{t(message)}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
