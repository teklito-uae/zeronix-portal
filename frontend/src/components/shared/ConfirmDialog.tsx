export const ConfirmDialog = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-admin-surface p-6 rounded-brand border border-admin-border max-w-sm w-full">
        <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
        <p className="text-admin-text-secondary mb-4">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border border-admin-border rounded-brand hover:bg-admin-surface-hover">Cancel</button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-brand hover:opacity-90">Confirm</button>
        </div>
      </div>
    </div>
  );
};
