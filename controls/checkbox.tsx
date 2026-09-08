import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import * as React from 'react';
import { Platform } from 'react-native';
import { Check } from '@/components/ui/icons';
import { cn } from '@/uiColorScheme/utils';

type CheckboxProps = CheckboxPrimitive.RootProps & {
  ref?: React.RefObject<CheckboxPrimitive.RootRef>;
};

function Checkbox({ className, checked, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'native:h-5 native:w-5 h-4 w-4 shrink-0 rounded-sm border border-primary web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        props.disabled && 'opacity-50 web:cursor-not-allowed',
        checked && 'bg-primary',
        className
      )}
      checked={checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="h-full w-full items-center justify-center">
        <Check
          size={12}
          strokeWidth={Platform.OS === 'web' ? 2.5 : 3}
          className="text-primary-foreground"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
