import "./Toggle.css";
export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-field">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span>{label}</span>
    </label>
  );
}
