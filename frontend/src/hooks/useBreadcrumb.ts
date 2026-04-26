import { useEffect } from 'react';
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore';

interface Segment {
  label: string;
  href?: string;
}

/**
 * Call this in any page/detail component to set the breadcrumb trail.
 * The Topbar reads from the same store and renders the segments.
 *
 * @example
 * useBreadcrumb([
 *   { label: 'Suppliers', href: '/admin/suppliers' },
 *   { label: supplier.name }
 * ]);
 */
export const useBreadcrumb = (segments: Segment[]) => {
  const setSegments = useBreadcrumbStore((s) => s.setSegments);
  const clear = useBreadcrumbStore((s) => s.clear);

  useEffect(() => {
    if (segments.length > 0) {
      setSegments(segments);
    }
    return () => {
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(segments)]);
};
