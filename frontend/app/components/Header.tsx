// Header oscuro con la identidad de Key Institute.
// Reutilizable en todas las paginas del panel.
export function Header() {
  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: 'var(--key-dark)' }}
    >
      <div className="flex items-center gap-3">
        {/* Logo local, servido desde public/brand/ */}
        <img
          src="/brand/key-logo.svg"
          alt="Key Institute"
          className="h-8 w-auto"
        />
        <span className="text-sm" style={{ color: 'var(--key-muted)' }}>
          panel de atención
        </span>
      </div>
      <span
        className="hidden text-xs sm:block"
        style={{ color: 'var(--key-muted)' }}
      >
        Instituto Kriete de Ingeniería y Ciencias
      </span>
    </header>
  );
}