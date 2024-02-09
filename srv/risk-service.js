
// Import the cds facade object (https://cap.cloud.sap/docs/node.js/cds-facade)
const cds = require('@sap/cds')

// The service implementation with all service handlers
module.exports = cds.service.impl(async function() {

    // Define constants for the Risk and BusinessPartner entities from the risk-service.cds file
    const { Risks, BusinessPartners } = this.entities;

    const bupa = await cds.connect.to('API_BUSINESS_PARTNER');

    this.on('READ', 'Suppliers', async req => {
        return bupa.run(req.query);
    });
    
    // This handler will be executed directly AFTER a READ operation on RISKS
    // With this we can loop through the received data set and manipulate the single risk entries
    this.after("READ", Risks, (data) => {
        // Convert to array, if it's only a single risk, so that the code won't break here
        const risks = Array.isArray(data) ? data : [data];

        // Looping through the array of risks to set the virtual field 'criticality' that you defined in the schema
        risks.forEach((risk) => {
            if( risk.impact >= 100000) {
                risk.criticality = 1;
            } else {
                risk.criticality = 2;
            }

            // set criticality for priority
            switch (risk.prio_code) {
                case 'H':
                    risk.PrioCriticality = 1;
                    break;
                case 'M':
                    risk.PrioCriticality = 2;
                    break;
                case 'L':
                    risk.PrioCriticality = 3;
                    break;
                default:
                    break;
            }

        })
    });
    this.on("READ", 'Risks', async (req, next) => {
        if (!req.query.SELECT.columns) return next();
        const expandIndex = req.query.SELECT.columns.findIndex(
            ({ expand, ref }) => expand && ref[0] === "supplier"
        );
        if (expandIndex < 0) return next();
  
        // Remove expand from query
        req.query.SELECT.columns.splice(expandIndex, 1);
  
        // Make sure supplier_ID will be returned
        if (!req.query.SELECT.columns.indexOf('*') >= 0 &&
            !req.query.SELECT.columns.find(
                column => column.ref && column.ref.find((ref) => ref == "supplier_ID"))
        ) {
            req.query.SELECT.columns.push({ ref: ["supplier_ID"] });
        }
  
        const risks = await next();
  
        const asArray = x => Array.isArray(x) ? x : [ x ];
  
        // Request all associated suppliers
        const supplierIds = asArray(risks).map(risk => risk.supplier_ID);
        const suppliers = await bupa.run(SELECT.from('RiskService.Suppliers').where({ ID: supplierIds }));
  
        // Convert in a map for easier lookup
        const suppliersMap = {};
        for (const supplier of suppliers)
            suppliersMap[supplier.ID] = supplier;
  
        // Add suppliers to result
        for (const note of asArray(risks)) {
            note.supplier = suppliersMap[note.supplier_ID];
        }
  
        return risks;
      });
  });