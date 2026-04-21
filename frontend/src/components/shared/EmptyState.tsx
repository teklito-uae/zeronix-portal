interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-brand">
      <h3 className="text-lg font-bold text-admin-text-primary mb-1">{title}</h3>
      <p className="text-admin-text-secondary mb-4">{description}</p>
      {action}
    </div>
  );
};
