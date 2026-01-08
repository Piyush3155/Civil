import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = `${title}: ${description}`;
    if (variant === 'destructive') {
      sonnerToast.error(message);
    } else if (variant === 'success') {
      sonnerToast.success(message);
    } else {
      sonnerToast(message);
    }
  };

  return { toast };
}

