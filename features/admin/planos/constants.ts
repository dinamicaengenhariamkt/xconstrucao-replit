import { PLANO_STATUS_LABEL, type PlanoStatus } from './types';

export const PAGE_SIZE = 5;

export const STATUS_OPTIONS: { value: PlanoStatus; label: string }[] =
  (Object.keys(PLANO_STATUS_LABEL) as PlanoStatus[]).map((v) => ({
    value: v,
    label: PLANO_STATUS_LABEL[v],
  }));
