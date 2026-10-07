export default function FieldRequirement({ required = true }) {
  return required ? <span className="field-requirement field-requirement-required" aria-label="Wajib">*</span> : null
}
