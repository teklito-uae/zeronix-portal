import { useParams } from 'react-router-dom';
import { SalesOrderEditor } from '@/components/shared/SalesOrderEditor';

export const SalesOrderDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <SalesOrderEditor id={id} isNew={isNew} />
  );
};
