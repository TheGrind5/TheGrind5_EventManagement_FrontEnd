import React, { useState, useEffect, useCallback, memo } from 'react';
import { TextField } from '@mui/material';

const DebouncedTextField = memo(({ 
  value, 
  onChange, 
  debounceMs = 300, 
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
});

export default DebouncedTextField;
