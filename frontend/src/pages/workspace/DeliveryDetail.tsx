import { useParams } from 'react-router-dom';
import { DeliveryEditor } from '@/components/shared/DeliveryEditor';

export const DeliveryDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <DeliveryEditor id={id} isNew={isNew} />
  );
};
