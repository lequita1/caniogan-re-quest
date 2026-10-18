import { useId } from "react";
import { Link } from "react-router";

export function Button({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? "Sandali lang…" : children}
    </button>
  );
}

export function ActionLink({
  children,
  variant = "secondary",
  className = "",
  ...props
}) {
  return (
    <Link className={`button button--${variant} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function Notice({ title, children, tone = "info", action, role }) {
  return (
    <section
      className={`notice notice--${tone}`}
      aria-label={title}
      role={role}
    >
      <h2 className="notice__title">{title}</h2>
      {children && <div className="notice__body">{children}</div>}
      {action && <div className="notice__action">{action}</div>}
    </section>
  );
}

export function TextField({
  label,
  hint,
  error,
  multiline = false,
  id: givenId,
  ...props
}) {
  const generatedId = useId();
  const id = givenId || generatedId;
  const descriptions = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <Control
        id={id}
        className="input"
        aria-describedby={descriptions || undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({ label, id: givenId, children, ...props }) {
  const generatedId = useId();
  const id = givenId || generatedId;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" {...props}>
        {children}
      </select>
    </div>
  );
}

export function RowLink({ title, description, to }) {
  return (
    <Link className="row-link" to={to}>
      <span className="row-link__title">{title}</span>
      {description && (
        <span className="row-link__description">{description}</span>
      )}
    </Link>
  );
}

export function PageHeading({
  title,
  description,
  backTo,
  backLabel = "Bumalik sa Tahanan",
}) {
  return (
    <div className="page-heading">
      {backTo && (
        <ActionLink to={backTo} className="back-link">
          {backLabel}
        </ActionLink>
      )}
      <h1 tabIndex="-1" id="page-title">
        {title}
      </h1>
      {description && <p className="muted">{description}</p>}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <div className="muted">{children}</div>
      {action}
    </section>
  );
}

export function Definition({ label, children }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
