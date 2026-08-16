import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBasePath } from '@/hooks/useBasePath';
import { DeliveryEditor } from '@/components/shared/DeliveryEditor';

// Deliveries are only ever created automatically from an accepted invoice
// (see InvoiceDetailView's "Make Delivery Note" action) — there is no manual
// creation flow, so bounce away from the old /deliveries/create URL.
export const DeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === 'create';

  useEffect(() => {
    if (isCreate) navigate(`${getBasePath()}/deliveries`, { replace: true });
  }, [isCreate, navigate]);

  if (isCreate || !id) return null;

  return <DeliveryEditor id={id} isNew={false} />;
};
