import DashboardController from './DashboardController'
import SearchController from './SearchController'
import AuditController from './AuditController'
import ProfileController from './ProfileController'
import CaseController from './CaseController'
import CaseIntegrityController from './CaseIntegrityController'
import FindingController from './FindingController'
import EvidenceController from './EvidenceController'
import EvidenceVerificationComparisonController from './EvidenceVerificationComparisonController'
import CustodyRequestController from './CustodyRequestController'
import ReportController from './ReportController'
import OfflineController from './OfflineController'
import OfflineSyncController from './OfflineSyncController'
import Auth from './Auth'

const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
    SearchController: Object.assign(SearchController, SearchController),
    AuditController: Object.assign(AuditController, AuditController),
    ProfileController: Object.assign(ProfileController, ProfileController),
    CaseController: Object.assign(CaseController, CaseController),
    CaseIntegrityController: Object.assign(CaseIntegrityController, CaseIntegrityController),
    FindingController: Object.assign(FindingController, FindingController),
    EvidenceController: Object.assign(EvidenceController, EvidenceController),
    EvidenceVerificationComparisonController: Object.assign(EvidenceVerificationComparisonController, EvidenceVerificationComparisonController),
    CustodyRequestController: Object.assign(CustodyRequestController, CustodyRequestController),
    ReportController: Object.assign(ReportController, ReportController),
    OfflineController: Object.assign(OfflineController, OfflineController),
    OfflineSyncController: Object.assign(OfflineSyncController, OfflineSyncController),
    Auth: Object.assign(Auth, Auth),
}

export default Controllers