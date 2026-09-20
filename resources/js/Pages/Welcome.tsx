import AuthenticatedSessionController from "@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController";
import DashboardController from "@/actions/App/Http/Controllers/DashboardController";
import OfflineController from "@/actions/App/Http/Controllers/OfflineController";
import { SecureLandingScreen } from "@/components/security/secure-landing-screen";
import { useWorkspaceLock } from "@/hooks/use-workspace-lock";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";

/**
 * VeriFact's entry screen — a secure workstation lock screen, not a
 * marketing page. Signs a guest in, or resumes an already-authenticated
 * session (online or from this device's offline cache) straight into the
 * workspace without re-collecting credentials.
 */
export default function Welcome({ auth }: PageProps) {
    const { unlock } = useWorkspaceLock({ enabled: false });

    const goOnline = async () => {
        unlock();
        router.visit(DashboardController.index().url);
    };

    const goOffline = () => {
        unlock();
        router.visit(OfflineController.index().url);
    };

    return (
        <>
            <Head title="VeriFact" />
            <SecureLandingScreen
                user={auth.user ? { id: auth.user.id, name: auth.user.name, role: auth.user.role } : null}
                loginHref={AuthenticatedSessionController.create().url}
                onUnlockOnline={goOnline}
                onUnlockOffline={goOffline}
            />
        </>
    );
}
