interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-brand p-5 shadow-sm border-t-2 border-t-zeronix-blue">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-admin-text-secondary mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-admin-text-primary">{value}</h3>
        </div>
        {icon && <div className="p-2 rounded-brand bg-zeronix-green-dim text-zeronix-green">{icon}</div>}
      </div>
    </div>
  );
};
