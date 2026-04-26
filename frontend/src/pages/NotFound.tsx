import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="text-[120px] font-black text-white/5 select-none leading-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center rotate-12 border border-emerald-500/20">
              <Search size={40} className="text-emerald-500 -rotate-12" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-800 h-11 px-8"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8"
          >
            <Home size={18} className="mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
