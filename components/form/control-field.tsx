import * as React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from 'react-hook-form';
import { Input } from '@/app.Commons/components/controls/input';
import { Label } from '@/app.Commons/components/controls/label';
import { Text } from '@/app.Commons/components/controls/text';

type ControlFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  editable?: boolean;
  multiline?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
};

export function ControlField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  editable = true,
  multiline = false,
  rules,
}: ControlFieldProps<TFieldValues>) {
  return (
    <View className="gap-1.5">
      <Label nativeID={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <>
            <Input
              aria-labelledby={name}
              value={(value as string | null | undefined) ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={editable}
              multiline={multiline}
              textAlignVertical={multiline ? 'top' : undefined}
              className={multiline ? 'native:h-32 h-32 py-2' : undefined}
            />
            {error?.message ? <Text className="text-xs text-destructive">{error.message}</Text> : null}
          </>
        )}
      />
    </View>
  );
}
