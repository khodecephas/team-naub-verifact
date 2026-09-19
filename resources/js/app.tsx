import '../css/app.css';
// import './bootstrap';

import { NotificationDialogProvider } from '@/components/notifications/NotificationDialogProvider';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Registered only in production builds so the service worker never
// intercepts requests during `vite dev`'s own hot-module reloading.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // A failed registration should never block the app from loading.
        });
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <NotificationDialogProvider>
                <App {...props} />
            </NotificationDialogProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
