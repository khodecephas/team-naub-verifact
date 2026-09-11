import { useNotificationDialog } from '@/components/notifications/NotificationDialogProvider';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export function FlashNotificationDialog() {
    const { flash } = usePage<PageProps>().props;
    const { notify } = useNotificationDialog();

    useEffect(() => {
        if (flash.error) {
            notify({
                title: 'Action could not be completed',
                message: flash.error,
                tone: 'error',
            });

            return;
        }

        if (flash.success) {
            notify({
                title: 'Action completed',
                message: flash.success,
                tone: 'success',
            });
        }
    }, [flash.error, flash.success, notify]);

    return null;
}
