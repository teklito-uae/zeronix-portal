import { useParams } from 'react-router-dom';
import { DocumentEditor } from '@/components/shared/DocumentEditor';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <DocumentEditor 
      type="invoice" 
      id={id} 
      isNew={isNew} 
    />
  );
};
