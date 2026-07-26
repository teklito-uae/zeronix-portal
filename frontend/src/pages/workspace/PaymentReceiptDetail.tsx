import { useParams } from 'react-router-dom';
import { PaymentReceiptEditor } from '@/components/shared/PaymentReceiptEditor';

export const PaymentReceiptDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <PaymentReceiptEditor id={id} isNew={isNew} />
  );
};
