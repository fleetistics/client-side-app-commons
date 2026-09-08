import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { View } from 'react-native';
import { Text, TextClassContext } from '@/app.Commons/controls/text';
import { cn } from '@/uiColorScheme/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border border-border bg-background p-4 shadow shadow-foreground/10',
  {
    variants: {
      variant: {
        default: 'bg-background',
        destructive: 'border-destructive bg-destructive/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const alertTextVariants = cva('text-sm text-foreground', {
  variants: {
    variant: {
      default: '',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertProps = React.ComponentPropsWithoutRef<typeof View> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <TextClassContext.Provider value={alertTextVariants({ variant })}>
      <View role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return <Text className={cn('text-sm leading-relaxed', className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
