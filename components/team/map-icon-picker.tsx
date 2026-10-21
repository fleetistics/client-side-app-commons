import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Bike,
  CarFront,
  Dog,
  Footprints,
  Gauge,
  Navigation,
  Plane,
  Sailboat,
  Shield,
  Tractor,
  Truck,
  Zap,
  type LucideIcon,
} from '@/components/ui/icons';
import { Label } from '@/app.Commons/components/controls/label';
import { Text } from '@/app.Commons/components/controls/text';
import { cn } from '@/uiColorScheme/utils';
import {
  TEAM_MEMBER_MAP_ICON_LABELS,
  TeamMemberMapIcon,
} from '@/client-side.Commons/dataLayer/model/team/team-map-icons';

// lucide has no helicopter / motorcycle / ATV glyphs, so the closest available ones stand in.
// Swap these for the real map-marker artwork once it exists.
const ICONS: Record<TeamMemberMapIcon, LucideIcon> = {
  [TeamMemberMapIcon.Default]: Navigation,
  [TeamMemberMapIcon.Atv]: Tractor,
  [TeamMemberMapIcon.Bearcat]: Truck,
  [TeamMemberMapIcon.Bike]: Bike,
  [TeamMemberMapIcon.Boat]: Sailboat,
  [TeamMemberMapIcon.Cruiser]: CarFront,
  [TeamMemberMapIcon.Foot]: Footprints,
  [TeamMemberMapIcon.Helicopter]: Plane,
  [TeamMemberMapIcon.K9]: Dog,
  [TeamMemberMapIcon.Motorcycle]: Gauge,
  [TeamMemberMapIcon.Segway]: Zap,
  [TeamMemberMapIcon.Swat]: Shield,
};

const ORDER = Object.values(TeamMemberMapIcon).filter((v): v is TeamMemberMapIcon => typeof v === 'number');

type MapIconPickerProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  editable?: boolean;
};

export function MapIconPicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  editable = true,
}: MapIconPickerProps<TFieldValues>) {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5">
      <Label nativeID={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2">
            {ORDER.map((key) => {
              const Icon = ICONS[key];
              const selected = (value ?? TeamMemberMapIcon.Default) === key;
              return (
                <Pressable
                  key={key}
                  disabled={!editable}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(key)}
                  style={{ width: '31%' }}
                  className={cn(
                    'items-center gap-1 rounded-md border px-2 py-3',
                    selected ? 'border-primary bg-primary/10' : 'border-input bg-background',
                    !editable && 'opacity-50'
                  )}
                >
                  <Icon className={selected ? 'text-primary' : 'text-foreground'} size={22} />
                  <Text className={cn('text-xs', selected && 'font-semibold text-primary')}>
                    {t(TEAM_MEMBER_MAP_ICON_LABELS[key])}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}
