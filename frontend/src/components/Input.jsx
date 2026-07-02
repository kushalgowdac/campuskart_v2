// ============================================================
// components/Input.jsx — Shared form input component
// ============================================================
// WHY this exists:
// Sell, Profile, Setup, Login all duplicated the same pattern:
// label + input + optional prefix (@,  u/, in/) + error text.
// This component handles all of those variations in one place.
//
// forwardRef is used because some browser APIs (like focus()) need
// a direct reference to the actual <input> DOM node, which a normal
// component function can't expose by default.
// ============================================================

import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,           // small gray helper text below the input
  prefix,         // e.g. "@" or "u/" — rendered inside the input on the left
  required = false,
  textarea = false,
  rows = 3,
  ...rest          // name, value, onChange, placeholder, type, etc.
}, ref) => {
  const Tag = textarea ? 'textarea' : 'input';

  return (
    <div>
      {label && (
        <label className="label">
          {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: '12px', top: textarea ? '12px' : '50%',
            transform: textarea ? 'none' : 'translateY(-50%)',
            color: 'var(--color-text-muted)', fontSize: '13px', pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        <Tag
          ref={ref}
          rows={textarea ? rows : undefined}
          className="input"
          style={{
            paddingLeft: prefix ? `${24 + prefix.length * 6}px` : undefined,
            borderColor: error ? 'var(--color-danger)' : undefined,
            resize: textarea ? 'vertical' : undefined,
          }}
          {...rest}
        />
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-muted" style={{ marginTop: '4px' }}>
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
