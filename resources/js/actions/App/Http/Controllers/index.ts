import DashboardController from './DashboardController'
import SearchController from './SearchController'
import ProfileController from './ProfileController'
import CaseController from './CaseController'
import FindingController from './FindingController'
import EvidenceController from './EvidenceController'
import EvidenceVerificationComparisonController from './EvidenceVerificationComparisonController'
import CustodyRequestController from './CustodyRequestController'
import ReportController from './ReportController'
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
    Auth: Object.assign(Auth, Auth),
}

export default Controllers