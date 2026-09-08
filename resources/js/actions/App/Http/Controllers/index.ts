import DashboardController from './DashboardController'
import ProfileController from './ProfileController'
import CaseController from './CaseController'
import EvidenceController from './EvidenceController'
import Auth from './Auth'

const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
    ProfileController: Object.assign(ProfileController, ProfileController),
    CaseController: Object.assign(CaseController, CaseController),
    EvidenceController: Object.assign(EvidenceController, EvidenceController),
    Auth: Object.assign(Auth, Auth),
}

export default Controllers