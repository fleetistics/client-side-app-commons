import * as Slot from '@rn-primitives/slot';
import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '@/uiColorScheme/utils';

const TextClassContext = React.createContext<string | undefined>(undefined);

type TextProps = React.ComponentProps<typeof RNText> & {
  asChild?: boolean;
};

function Text({ className, asChild = false, ...props }: TextProps) {
  const textClass = React.useContext(TextClassContext);
  const combinedClassName = cn('text-base text-foreground', textClass, className);
  if (asChild) {
    return <Slot.Text className={combinedClassName} {...props} />;
  }
  return <RNText className={combinedClassName} {...props} />;
}

export { Text, TextClassContext };
