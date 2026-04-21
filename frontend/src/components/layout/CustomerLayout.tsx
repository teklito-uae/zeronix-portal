import { Outlet } from 'react-router-dom';

export const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-cust-bg text-cust-text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-cust-border bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-zeronix-blue">Zeronix Portal</div>
          <nav>
            <ul className="flex gap-4">
              <li>Products</li>
              <li>My Enquiries</li>
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
