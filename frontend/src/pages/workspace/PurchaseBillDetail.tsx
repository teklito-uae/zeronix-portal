import { useParams } from 'react-router-dom';
import { PurchaseBillEditor } from '@/components/shared/PurchaseBillEditor';

export const PurchaseBillDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <PurchaseBillEditor
      id={id}
      isNew={isNew}
    />
  );
};
