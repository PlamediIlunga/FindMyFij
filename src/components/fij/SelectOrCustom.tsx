// src/components/.../SelectOrCustom.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './FIJForm.module.scss';

interface SelectOrCustomProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  otherLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const CUSTOM_OPTION = '__custom__';

export function SelectOrCustom({
  label,
  value,
  onChange,
  options,
  otherLabel = 'Autre — saisir manuellement',
  placeholder = '',
  disabled = false,
  required = false,
}: SelectOrCustomProps) {
  const valueInOptions = value !== '' && options.includes(value);
  const [mode, setMode] = useState<'list' | 'custom'>(
    value && !valueInOptions ? 'custom' : 'list'
  );

  // Si les options changent (ex: la liste de villes change quand la
  // province change) et que la valeur actuelle n'y figure plus, on vide.
  useEffect(() => {
    if (mode === 'list' && value && !options.includes(value)) {
      onChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  function handleSelectChange(selected: string) {
    if (selected === CUSTOM_OPTION) {
      setMode('custom');
      onChange('');
    } else {
      setMode('list');
      onChange(selected);
    }
  }

  const id = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {mode === 'list' ? (
        <select
          id={id}
          className={styles.select}
          value={value}
          onChange={(e) => handleSelectChange(e.target.value)}
          disabled={disabled}
          required={required}
        >
          <option value="" disabled>
            Sélectionner
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={CUSTOM_OPTION}>{otherLabel}</option>
        </select>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id={id}
            className={styles.input}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
          />
          {options.length > 0 && (
            <button
              type="button"
              className={styles.geocodeButton}
              onClick={() => {
                setMode('list');
                onChange('');
              }}
            >
              Retour à la liste
            </button>
          )}
        </div>
      )}
    </div>
  );
}