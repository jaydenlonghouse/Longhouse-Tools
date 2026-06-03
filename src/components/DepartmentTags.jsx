export default function DepartmentTags({ departments, className = '' }) {
  if (!departments?.length) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {departments.map(dept => (
        <span
          key={dept}
          className="inline-flex rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800"
        >
          {dept}
        </span>
      ))}
    </div>
  )
}
