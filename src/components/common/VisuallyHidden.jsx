/**
 * VisuallyHidden component for screen reader only content
 * Makes content accessible to screen readers while hiding it visually
 */
export function VisuallyHidden({ children, as: Component = 'span' }) {
  return (
    <Component
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </Component>
  );
}
