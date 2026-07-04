export const CATEGORIAS_GASTO = [
  'Alimentos',
  'Bebidas',
  'Insumos',
  'Aseo',
  'Nómina',
  'Otros',
] as const

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]
