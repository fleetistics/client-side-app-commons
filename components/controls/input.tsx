import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/uiColorScheme/utils';

type InputProps = React.ComponentProps<typeof TextInput>;

function Input({ className, placeholderClassName, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'native:h-12 h-10 native:text-lg rounded-md border border-input bg-background px-3 web:py-2 text-base text-foreground web:ring-offset-background placeholder:text-muted-foreground web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      {...props}
    />
  );
}

export { Input };
