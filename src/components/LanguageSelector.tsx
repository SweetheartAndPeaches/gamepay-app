'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/i18n/context';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale, availableLocales, localeNames } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        setLocale(value as any);
        setOpen(false);
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="w-[120px] sm:w-[140px]">
        <Languages className="w-4 h-4 mr-2 flex-shrink-0" />
        <SelectValue placeholder={localeNames[locale]} className="truncate">
          {localeNames[locale]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableLocales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
