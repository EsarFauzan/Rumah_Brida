export default function FieldRequirement({ required = true }) {
  return <span className="field-requirement">{required ? 'Wajib' : 'Opsional'}</span>
}
