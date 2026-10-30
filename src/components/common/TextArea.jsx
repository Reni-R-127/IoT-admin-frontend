import "./TextArea.css";
export default function TextArea({
  label,
  value,
  onChange,
  required = false,
  wide = false,
  rows = 3,
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && " *"}
      </span>

      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
