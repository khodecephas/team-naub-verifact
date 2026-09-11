import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    createContext,
    PropsWithChildren,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export interface NotificationDialogOptions {
    title: string;
    message: string;
    tone?: NotificationTone;
    details?: ReactNode;
    actionLabel?: string;
}

interface NotificationDialogContextValue {
    notify: (options: NotificationDialogOptions) => void;
    dismiss: () => void;
}

const NotificationDialogContext = createContext<NotificationDialogContextValue | null>(null);

const toneStyles: Record<NotificationTone, { icon: string; iconClassName: string }> = {
    success: { icon: 'check_circle', iconClassName: 'bg-emerald-100 text-emerald-700' },
    error: { icon: 'error', iconClassName: 'bg-red-100 text-red-700' },
    warning: { icon: 'warning', iconClassName: 'bg-amber-100 text-amber-700' },
    info: { icon: 'info', iconClassName: 'bg-blue-100 text-blue-700' },
};

export function NotificationDialogProvider({ children }: PropsWithChildren) {
    const [notification, setNotification] = useState<NotificationDialogOptions | null>(null);
    const [open, setOpen] = useState(false);

    const notify = useCallback((options: NotificationDialogOptions) => {
        setNotification(options);
        setOpen(true);
    }, []);

    const dismiss = useCallback(() => setOpen(false), []);
    const contextValue = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);
    const tone = notification?.tone ?? 'info';
    const style = toneStyles[tone];

    return (
        <NotificationDialogContext.Provider value={contextValue}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                {notification ? (
                    <DialogContent>
                        <DialogHeader className="text-center">
                            <span className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${style.iconClassName}`}>
                                <span aria-hidden="true" className="material-symbols-outlined text-[30px]">
                                    {style.icon}
                                </span>
                            </span>
                            <DialogTitle className="text-lg">{notification.title}</DialogTitle>
                            <DialogDescription>{notification.message}</DialogDescription>
                        </DialogHeader>
                        {notification.details ? <div className="px-5 py-5">{notification.details}</div> : null}
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button">{notification.actionLabel ?? 'OK'}</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                ) : null}
            </Dialog>
        </NotificationDialogContext.Provider>
    );
}

export function useNotificationDialog(): NotificationDialogContextValue {
    const context = useContext(NotificationDialogContext);

    if (!context) {
        throw new Error('useNotificationDialog must be used inside NotificationDialogProvider.');
    }

    return context;
}
