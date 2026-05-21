export const SPORT_LABEL = {
  football: 'Calcio',
  volleyball: 'Pallavolo',
  basketball: 'Basket',
};

export const SPORT_OPTIONS = [
  { value: 'football', label: 'Calcio' },
  { value: 'volleyball', label: 'Pallavolo' },
  { value: 'basketball', label: 'Basket' },
];

export const SPORT_OPTIONS_WITH_ALL = [
  { value: '', label: 'Tutti gli sport' },
  ...SPORT_OPTIONS,
];

export const STATUS_LABEL = {
  upcoming: 'In arrivo',
  active: 'In corso',
  completed: 'Concluso',
};
