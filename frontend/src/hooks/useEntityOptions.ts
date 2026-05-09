/**
 * useEntityOptions
 *
 * Hook reutilizable para cargar opciones de listbox (selectores) desde el
 * mantenedor generico. Emerge del Sprint 1+2 P0/P1 saneamiento de catalogos
 * UI (chip 107) - patron observado en DetalleForm, CreateSpecialOT, ClientForm,
 * InstallationForm: cada form repetia useState + useEffect + fetch + map para
 * poblar dropdowns desde tablas de mantenedor.
 *
 * Uso:
 *   const { data: clientes, isLoading } = useEntityOptions('canales');
 *   <select>
 *     {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
 *   </select>
 *
 * Con mapper custom:
 *   const { data } = useEntityOptions('fsc', { mapper: (it) => ({ id: it.id, codigo: it.codigo, label: it.nombre }) });
 *
 * Sin react-query: hook puro con useState + useEffect (compat con forms que
 * ya tienen react-query o no). Cache via Map en modulo.
 */
import { useEffect, useState } from 'react';
import { genericApi, type GenericListItem } from '../services/api';

interface UseEntityOptionsOptions<T = GenericListItem> {
  pageSize?: number;
  activo?: number;
  enabled?: boolean;
  mapper?: (item: GenericListItem) => T;
}

interface UseEntityOptionsResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
}

const cache = new Map<string, GenericListItem[]>();

export function useEntityOptions<T = GenericListItem>(
  tablaKey: string,
  options: UseEntityOptionsOptions<T> = {}
): UseEntityOptionsResult<T> {
  const { pageSize = 100, activo, enabled = true, mapper } = options;
  const cacheKey = `${tablaKey}:${pageSize}:${activo ?? 'all'}`;

  const [items, setItems] = useState<GenericListItem[]>(() => cache.get(cacheKey) ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cache.has(cacheKey) && enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(cacheKey)) {
      setItems(cache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    genericApi
      .list(tablaKey, { page_size: pageSize, activo })
      .then((res) => {
        if (cancelled) return;
        cache.set(cacheKey, res.items);
        setItems(res.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tablaKey, pageSize, activo, enabled, cacheKey]);

  const data = mapper ? items.map(mapper) : (items as unknown as T[]);
  return { data, isLoading, error };
}
