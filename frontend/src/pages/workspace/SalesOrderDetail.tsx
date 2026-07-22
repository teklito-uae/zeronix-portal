import { useParams } from 'react-router-dom';
import { TransactionEditor } from '@/components/shared/TransactionEditor';

export const SalesOrderDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <TransactionEditor type="sales-order" id={id} isNew={isNew} />
  );
};
