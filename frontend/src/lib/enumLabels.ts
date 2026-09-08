/**
 * Display text for the backend's enum values. The value sent to the API is
 * always the raw enum (e.g. "POSTRE") — only the label shown to the user changes.
 * Falls back to the raw value for anything not mapped, so a new backend enum
 * still renders instead of disappearing.
 */
const labels: Record<string, string> = {
  DESAYUNO: 'Breakfast',
  ALMUERZO: 'Lunch',
  MERIENDA: 'Snack time',
  CENA: 'Dinner',
  ENTRADA: 'Starter',
  POSTRE: 'Dessert',
  SNACK: 'Snack',
  BEBIDA: 'Drink',
  FACIL: 'Easy',
  MEDIA: 'Medium',
  DIFICIL: 'Hard',
  MINUTOS: 'min',
  HORAS: 'h',
  SIN_UNIDAD: 'no unit',
  UNIDAD: 'unit',
  GRAMO: 'g',
  KILOGRAMO: 'kg',
  MILILITRO: 'ml',
  LITRO: 'l',
  CUCHARADITA: 'tsp',
  CUCHARADA: 'tbsp',
  TAZA: 'cup',
  ONZA: 'oz',
  LIBRA: 'lb',
  PIZCA: 'pinch',
  DIENTE: 'clove',
  LATA: 'can',
  PAQUETE: 'pack',
  A_GUSTO: 'to taste',
}

export const enumLabel = (value: string): string => labels[value] ?? value

export const toOptions = (values: string[]) =>
  values.map((value) => ({ value, label: enumLabel(value) }))
