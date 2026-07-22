import { useParams } from 'react-router-dom';
import { TransactionEditor } from '@/components/shared/TransactionEditor';

export const PurchaseBillDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <TransactionEditor type="purchase-bill" id={id} isNew={isNew} />
  );
};
