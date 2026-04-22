import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-admin-surface border-admin-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-admin-text-primary">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-admin-text-secondary">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-admin-border text-admin-text-secondary hover:bg-admin-surface-hover">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === 'destructive'
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-zeronix-blue text-white hover:bg-zeronix-blue-hover'
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
