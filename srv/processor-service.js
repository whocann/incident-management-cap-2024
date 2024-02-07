const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));

    this.on('ga_op_calculation', req => { 
      console.log(req.data);
      req.info(`ga_op_calculate \n\n action triggered with context: \n\n ${JSON.stringify(req.params)}`);
    }); 

    this.on('READ', "BusinessPartners", async (req)=> { 
      req.query.where("LastName <> '' and FirstName <> '' ");
      const BPsrv = await cds.connect.to("API_BUSINESS_PARTNER");
      return await BPsrv.transaction(req).send({
          query: req.query,
          headers: {
              apikey: process.env.apikey,
          },
      });
    });
    return super.init();
  }

  changeUrgencyDueToSubject(data) {
    if (data) {
      const incidents = Array.isArray(data) ? data : [data];
      incidents.forEach((incident) => {
        if (incident.title?.toLowerCase().includes("urgent")) {
          incident.urgency = { code: "H", descr: "High" };
        }
      });
    }
  }

  /** Custom Validation */
  async onUpdate (req) {
    const { status_code } = await SELECT.one(req.subject, i => i.status_code).where({ID: req.data.ID})
    if (status_code === 'C')
      return req.reject(`Can't modify a closed incident`)
  }

  
}
module.exports = ProcessorService
