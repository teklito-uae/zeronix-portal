import { useParams } from 'react-router-dom';
import { QuoteInvoiceEditor } from '@/components/shared/quote-invoice/QuoteInvoiceEditor';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <QuoteInvoiceEditor type="invoice" id={id} isNew={isNew} />
  );
};
