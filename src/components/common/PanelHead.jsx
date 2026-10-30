import "./PanelHead.css";
export default function PanelHead({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          className="primary-button"
          onClick={onAction}
        >
          + {actionLabel}
        </button>
      )}
    </div>
  );
}
