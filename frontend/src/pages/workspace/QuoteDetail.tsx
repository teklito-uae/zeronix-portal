import { useParams } from 'react-router-dom';
import { DocumentEditor } from '@/components/shared/DocumentEditor';

export const QuoteDetail = () => {
  const { id } = useParams();
  const isNew = id === 'create';

  return (
    <DocumentEditor 
      type="quote" 
      id={id} 
      isNew={isNew} 
    />
  );
};
