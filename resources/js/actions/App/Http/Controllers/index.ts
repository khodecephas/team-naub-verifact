import DashboardController from './DashboardController'
import SearchController from './SearchController'
import ProfileController from './ProfileController'
import CaseController from './CaseController'
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
    ProfileController: Object.assign(ProfileController, ProfileController),
    CaseController: Object.assign(CaseController, CaseController),
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