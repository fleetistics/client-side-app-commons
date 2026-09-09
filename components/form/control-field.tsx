import * as React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '@/app.Commons/components/controls/input';
import { Label } from '@/app.Commons/components/controls/label';

type ControlFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  editable?: boolean;
};

export function ControlField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  editable = true,
}: ControlFieldProps<TFieldValues>) {
  return (
    <View className="gap-1.5">
      <Label nativeID={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            aria-labelledby={name}
            value={(value as string | null | undefined) ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            editable={editable}
          />
        )}
      />
    </View>
  );
}
