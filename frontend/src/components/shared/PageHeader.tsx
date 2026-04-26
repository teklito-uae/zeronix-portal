interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="hidden md:flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl font-semibold text-admin-text-primary">{title}</h1>
        {description && <p className="text-sm text-admin-text-secondary mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
