import DashboardController from './DashboardController'
import SearchController from './SearchController'
import ProfileController from './ProfileController'
import CaseController from './CaseController'
import EvidenceController from './EvidenceController'
import EvidenceVerificationComparisonController from './EvidenceVerificationComparisonController'
import CustodyController from './CustodyController'
import CustodyRequestController from './CustodyRequestController'
import ReportController from './ReportController'
import Auth from './Auth'

const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
    SearchController: Object.assign(SearchController, SearchController),
    ProfileController: Object.assign(ProfileController, ProfileController),
    CaseController: Object.assign(CaseController, CaseController),
    EvidenceController: Object.assign(EvidenceController, EvidenceController),
    EvidenceVerificationComparisonController: Object.assign(EvidenceVerificationComparisonController, EvidenceVerificationComparisonController),
    CustodyController: Object.assign(CustodyController, CustodyController),
    CustodyRequestController: Object.assign(CustodyRequestController, CustodyRequestController),
    ReportController: Object.assign(ReportController, ReportController),
    Auth: Object.assign(Auth, Auth),
}

export default Controllers