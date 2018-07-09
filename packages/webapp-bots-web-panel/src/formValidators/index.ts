export const required = (value: any) =>
  value ? undefined : 'The field is required';

export const numericality = (
  {
    gt,
    gte,
    lt,
    lte,
  }: {
    gt: number;
    gte: number;
    lt: number;
    lte: number;
  } = {
    gt: -Infinity,
    gte: -Infinity,
    lt: Infinity,
    lte: Infinity,
  }
) => (value: number) => {
  const isGt = value > gt;
  const isGte = value >= gte;
  const isLt = value < lt;
  const isLte = value < lte;

  if (!isGt) {
    return `Value mas be greater than ${gt}`;
  }
  if (!isGte) {
    return `Value mas be greater than or equal to ${gte}`;
  }
  if (!isLt) {
    return `Value mas be lesser than ${lt}`;
  }
  if (!isLte) {
    return `Value mas be lesser than or equal to ${lte}`;
  }
  return undefined;
};

export const length = ({ min, max }: { min?: number; max?: number }) => (
  value: string | any[]
) => {
  const minLength = min || -Infinity;
  const maxLength = max || Infinity;
  const valLength = (value && value.length) || 0;

  if (!minLength || !maxLength) {
    return undefined;
  }

  if (valLength < minLength) {
    return `Value must be at least ${minLength} characters long`;
  }
  if (valLength > maxLength) {
    return `Value cannot be more ${maxLength} characters long`;
  }

  return undefined;
};
