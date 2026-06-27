'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EMPTY_VALUE = '__empty__';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}

function toRadixValue(value: string): string {
  return value === '' ? EMPTY_VALUE : value;
}

function fromRadixValue(value: string): string {
  return value === EMPTY_VALUE ? '' : value;
}

export function FormSelect({
  id,
  name,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  options,
  placeholder = 'Seleccionar…',
  disabled,
  required,
  className,
  triggerClassName,
  ariaLabel,
}: FormSelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;

  function handleChange(nextRadix: string) {
    const next = fromRadixValue(nextRadix);
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  }

  const radixValue = value === '' ? undefined : toRadixValue(value);

  return (
    <div className={cn(className)}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required && value === ''}
        />
      ) : null}
      <Select
        value={radixValue}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} aria-label={ariaLabel} className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={toRadixValue(option.value)}
              value={toRadixValue(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
