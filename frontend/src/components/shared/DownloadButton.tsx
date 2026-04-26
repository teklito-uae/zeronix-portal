import { Button } from '@/components/ui/button';
import { Download, Loader2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/axios';

interface DownloadButtonProps {
  type: 'invoice' | 'quote';
  id: number | string;
  number?: string | null;
  variant?: 'outline' | 'ghost' | 'default' | 'secondary';
  size?: 'sm' | 'md' | 'icon';
  label?: string;
  mode?: 'download' | 'view';
}

export const DownloadButton = ({ 
  type, 
  id, 
  number,
  variant = 'outline', 
  size = 'sm',
  label,
  mode = 'download'
}: DownloadButtonProps) => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const role = location.pathname.startsWith('/admin') ? 'admin' : 'customer';

    // Priority: Number-based Global URL for View
    if (mode === 'view' && number) {
      window.open(`${apiBase}/portal/${type}s/${number}/view`, '_blank');
      setLoading(false);
      return;
    }

    if (mode === 'view') {
      const endpoint = `${role}/${type}s/${id}/view`;
      window.open(`${apiBase}/${endpoint}`, '_blank');
      setLoading(false);
      return;
    }

    try {
      const endpoint = number 
        ? `/portal/${type}s/${number}/download` 
        : `/${role}/${type}s/${id}/download`;

      const response = await api.get(endpoint, { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Zeronix-${type.charAt(0).toUpperCase() + type.slice(1)}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Action failed', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLabel = label || (mode === 'view' ? 'View' : 'PDF');

  return (
    <Button 
      variant={variant} 
      size={size === 'icon' ? 'icon' : 'sm'}
      disabled={loading}
      onClick={handleAction}
      className={size === 'icon' ? 'h-8 w-8 rounded-lg' : 'h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium'}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : mode === 'view' ? (
        <Eye size={14} className={variant === 'default' ? 'text-white' : 'text-emerald-500'} />
      ) : (
        <Download size={14} className={variant === 'default' ? 'text-white' : 'text-emerald-500'} />
      )}
      {size !== 'icon' && <span>{currentLabel}</span>}
    </Button>
  );
};
