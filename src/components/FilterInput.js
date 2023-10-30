
import React from 'react';

function FilterInput({ onChange }) {
  return (
    <input
      className="p-2 border rounded w-full"
      placeholder="Фильтр...   (В разработке)"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default FilterInput;
