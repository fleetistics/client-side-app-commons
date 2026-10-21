import * as React from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from '@/components/ui/icons';
import { Input } from '@/app.Commons/components/controls/input';
import { Label } from '@/app.Commons/components/controls/label';
import { Text } from '@/app.Commons/components/controls/text';
import {
  DEFAULT_PHONE_REGION,
  FormatPhoneForStorage,
  GetPhoneCountries,
  GetPhoneCountry,
  GetPhoneFormatHint,
  ParsePhoneInput,
  SplitStoredPhone,
  type PhoneCountry,
} from '@/app.Commons/helpers/phone-countries';

type PhoneFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  /** Holds the phone in international format ("+1 201-555-0123"), or null when empty. */
  name: FieldPath<TFieldValues>;
  label: string;
  editable?: boolean;
};

type PhoneDraft = {
  /** What the input shows: national format when valid, otherwise what the user typed. */
  text: string;
  /** Selected country, ISO region. Internal only - the form never sees it. */
  region: string;
};

function DraftFromValue(value: string | null | undefined): PhoneDraft {
  const { region, national } = SplitStoredPhone(value);
  return { region, text: national };
}

/**
 * Country flag dropdown + number input, bound to ONE form field that holds the number in international
 * format. The selected country is kept inside the component and used to parse/validate what is typed.
 * Typing a full valid number (also an international one like "+44 20 7946 0958") reformats it nationally
 * and switches the country to the number's own - the same behaviour as the mf5 PhoneInput.
 */
export function PhoneField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  editable = true,
}: PhoneFieldProps<TFieldValues>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const regionRef = React.useRef(DEFAULT_PHONE_REGION);
  const phone = useController({
    control,
    name,
    rules: {
      validate: (v: unknown): string | true => {
        const text = String(v ?? '').trim();
        if (!text) return true;
        // The value is international, so it parses on its own; the selected region feeds the hint.
        const region = regionRef.current;
        return (
          ParsePhoneInput(text, region).isValid ||
          `${t('Invalid phone format. Expected:')} ${GetPhoneFormatHint(region)}`
        );
      },
    },
  });

  const formValue = (phone.field.value as string | null | undefined) ?? null;
  const [draft, setDraft] = React.useState<PhoneDraft>(() => DraftFromValue(formValue));
  regionRef.current = draft.region;
  // Last value this component wrote, to tell its own changes from external ones (form reset / load).
  const emittedRef = React.useRef<string | null>(formValue);
  React.useEffect(() => {
    if (formValue === emittedRef.current) return;
    emittedRef.current = formValue;
    // Cleared from outside: keep the chosen country, there is nothing to derive it from.
    setDraft((d) => (formValue ? DraftFromValue(formValue) : { ...d, text: '' }));
  }, [formValue]);

  const update = (next: PhoneDraft) => {
    setDraft(next);
    const intl = FormatPhoneForStorage(next.text, next.region);
    emittedRef.current = intl;
    phone.field.onChange(intl);
  };

  const { region } = draft;
  const selected = GetPhoneCountry(region);

  const onChangeText = (text: string) => update(ParsePhoneInput(text, region));

  const onSelectCountry = (c: PhoneCountry) => {
    // Re-evaluate what is already typed against the newly chosen country; the choice wins over any detected one.
    update({ text: ParsePhoneInput(draft.text, c.region).text, region: c.region });
    setOpen(false);
  };

  return (
    <View className="gap-1.5">
      <Label nativeID={name}>{label}</Label>
      <View className="flex-row gap-2">
        <Pressable
          disabled={!editable}
          onPress={() => setOpen(true)}
          className="native:h-12 h-10 flex-row items-center gap-1 rounded-md border border-input bg-background px-3"
        >
          <Text accessibilityLabel={selected?.name}>{selected ? selected.flag : region}</Text>
          <ChevronRight className="text-muted-foreground" size={14} />
        </Pressable>
        <View className="flex-1">
          <Input
            aria-labelledby={name}
            value={draft.text}
            onChangeText={onChangeText}
            onBlur={phone.field.onBlur}
            editable={editable}
            keyboardType="phone-pad"
          />
        </View>
      </View>
      {phone.fieldState.error?.message ? (
        <Text className="text-xs text-destructive">{phone.fieldState.error.message}</Text>
      ) : null}
      <CountryPickerModal
        visible={open}
        selectedRegion={region}
        onSelect={onSelectCountry}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

type CountryPickerModalProps = {
  visible: boolean;
  selectedRegion: string;
  onSelect: (country: PhoneCountry) => void;
  onClose: () => void;
};

function CountryPickerModal({ visible, selectedRegion, onSelect, onClose }: CountryPickerModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = GetPhoneCountries();
    if (!q) return all;
    return all.filter(
      (c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase() === q || c.dialCode.includes(q)
    );
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onDismiss={() => setQuery('')}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-2 p-3">
          <View className="flex-1">
            <Input value={query} onChangeText={setQuery} placeholder={t('Search country or code')} autoCorrect={false} />
          </View>
          <Pressable onPress={onClose} className="px-2 py-2">
            <Text>{t('Close')}</Text>
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(c) => c.region}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable className="flex-row items-center gap-3 px-4 py-3" onPress={() => onSelect(item)}>
              <Text>{item.flag}</Text>
              <Text className={`flex-1 ${item.region === selectedRegion ? 'font-semibold' : ''}`}>{item.name}</Text>
              <Text className="text-muted-foreground">{item.dialCode}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
