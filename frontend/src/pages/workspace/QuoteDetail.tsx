import { useParams } from 'react-router-dom';
import { QuoteInvoiceEditor } from '@/components/shared/quote-invoice/QuoteInvoiceEditor';

export const QuoteDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <QuoteInvoiceEditor type="quote" id={id} isNew={isNew} />
  );
};
