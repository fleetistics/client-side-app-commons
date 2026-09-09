import * as LabelPrimitive from '@rn-primitives/label';
import * as React from 'react';
import { cn } from '@/uiColorScheme/utils';

type LabelProps = LabelPrimitive.TextProps & {
  ref?: React.RefObject<LabelPrimitive.TextRef>;
};

function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      className="web:cursor-default"
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <LabelPrimitive.Text
        className={cn(
          'native:text-base text-sm font-medium leading-none text-foreground web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    </LabelPrimitive.Root>
  );
}

export { Label };
