import "./Field.css";
export default function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
