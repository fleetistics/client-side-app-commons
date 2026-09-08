import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/app.Commons/controls/button';

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'children'> & {
  isSubmitting?: boolean;
  children?: React.ReactNode;
};

export function SubmitButton({
  isSubmitting,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button  {...props}>
      <View className="flex-row items-center gap-2">
        {isSubmitting && <ActivityIndicator size="small" color="#f59e0b" />}
        {children}
      </View>
    </Button>
  );
}
