'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '@/lib/utils';

export default function SearchInput({ placeholder = 'Cari...', onSearch, className = '' }) {
  const [value, setValue] = useState('');
  const debouncedSearch = useRef(debounce(onSearch || (() => {}), 400)).current;

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    onSearch?.('');
  };

  return (
    <div className={`input-wrapper ${className}`} style={{ maxWidth: 320 }}>
      <Search size={16} className="input-icon" />
      <input
        type="search"
        className="form-input input-with-icon"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        style={{ paddingRight: value ? 40 : 14 }}
        aria-label={placeholder}
      />
      {value && (
        <button className="input-icon-right" onClick={handleClear} aria-label="Hapus pencarian">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
