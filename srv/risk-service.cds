
using {riskmanagement as rm} from '../db/schema2';

@path: 'service/risk'
service RiskService {
    entity Risks       as projection on rm.Risks;
    annotate Risks with @odata.draft.enabled;

    entity Mitigations as projection on rm.Mitigations;
    annotate Mitigations with @odata.draft.enabled;

    @readonly
    entity Suppliers as projection on rm.Suppliers;
    // BusinessPartner will be used later
    //@readonly entity BusinessPartners as projection on rm.BusinessPartners;
}