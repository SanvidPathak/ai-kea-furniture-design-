export function Input({
  label,
  error,
  type = 'text',
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
