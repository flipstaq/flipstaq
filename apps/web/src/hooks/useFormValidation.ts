import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export function useFormValidation(rules: ValidationRules) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedFields] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  const validateField = (name: string, value: any): string => {
    const rule = rules[name];
    if (!rule) return '';

    if (
      rule.required &&
      (!value || (typeof value === 'string' && value.trim() === ''))
    ) {
      return rule.message || t('validation.required', 'auth');
    }

    if (
      rule.minLength &&
      typeof value === 'string' &&
      value.length < rule.minLength
    ) {
      return rule.message || `Minimum ${rule.minLength} characters required`;
    }

    if (
      rule.maxLength &&
      typeof value === 'string' &&
      value.length > rule.maxLength
    ) {
      return rule.message || `Maximum ${rule.maxLength} characters allowed`;
    }

    if (
      rule.pattern &&
      typeof value === 'string' &&
      !rule.pattern.test(value)
    ) {
      return rule.message || 'Invalid format';
    }

    if (rule.custom && !rule.custom(value)) {
      return rule.message || 'Invalid value';
    }

    return '';
  };

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const setTouched = (name: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    Object.keys(rules).forEach((name) => {
      const error = validateField(name, values[name]);
      newErrors[name] = error;
      if (error) hasErrors = true;
    });

    setErrors(newErrors);
    setTouchedFields(
      Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return !hasErrors;
  };

  const reset = () => {
    setValues({});
    setErrors({});
    setTouchedFields({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
    isValid: Object.keys(errors).every((key) => !errors[key]),
  };
}
