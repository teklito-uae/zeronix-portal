import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description?: string;
}

export const SEO = ({ title, description }: SEOProps) => {
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | Zeronix Portal`;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || 'Zeronix - B2B Industrial Purchasing Platform');
    }
  }, [title, description, location]);

  return null;
};
