import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should merge conflicting Tailwind classes correctly', () => {
    const result = cn('px-4 px-6', 'py-2 py-4');
    expect(result).toBe('px-6 py-4');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['px-4', 'py-2'], 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'px-4': true,
      'py-2': true,
      'bg-red-500': false,
      'bg-blue-500': true,
    });
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined inputs', () => {
    const result = cn('px-4', null, undefined, 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle complex mixed inputs', () => {
    const isActive = true;
    const variant = 'primary';
    const result = cn(
      'base-class',
      {
        'active-class': isActive,
        'inactive-class': !isActive,
      },
      variant === 'primary' && 'primary-class',
      ['additional', 'classes']
    );
    expect(result).toBe('base-class active-class primary-class additional classes');
  });
});