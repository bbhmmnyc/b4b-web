import React from 'react';
import { Globe2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGES, getLanguage } from '../i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, t } = useApp();
  const active = getLanguage(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="system-label inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-teal-700 transition-colors"
          data-testid="language-selector"
          aria-label={t('language')}
        >
          <Globe2 className="w-4 h-4" />
          {compact ? active.code.toUpperCase() : active.nativeName}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-lg">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? 'font-bold text-teal-700' : ''}`}
            data-testid={`language-${lang.code}`}
          >
            <span>{lang.nativeName}</span>
            <span className="ml-auto text-xs text-slate-400">{lang.code.toUpperCase()}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
