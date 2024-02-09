using { sap.capire.incidents as my } from '../db/schema';


// using an external service from SAP S/4HANA Cloud
using { API_BUSINESS_PARTNER as external } from './external/API_BUSINESS_PARTNER.csn';



service ProcessorService { 

    
entity BusinessPartners as projection on external.A_BusinessPartner {
   key BusinessPartner,
   BusinessPartnerFullName as FullName,
}

    type inText : {
      comment: String;
    };
    entity Incidents as projection on my.Incidents actions {
      action ga_op_calculation(text:inText:comment, text2:inText:comment);
          //Table Actions
      action ta_lr_toolbarAction();
    };

    @readonly
    entity Customers as projection on my.Customers;
    
}

extend projection ProcessorService.Customers with {
  firstName || ' ' || lastName as name: String
}

annotate ProcessorService.Incidents with @odata.draft.enabled; 

//disable create action
//annotate ProcessorService.Incidents with @(Capabilities.Insertable: false);

//disable action by conditions
annotate ProcessorService.Incidents with @(
  UI.DeleteHidden : {$edmJson: {$Ne: [
        {$Path: 'status_code'}, 'C'
  ]}}
);


annotate ProcessorService with @(requires: 'support');

//custom action button
annotate ProcessorService.Incidents with @(UI.Identification: [
{
  $Type      : 'UI.DataFieldForAction',
  Action     : 'ProcessorService.ga_op_calculation',
  Label      : 'Custom Trigger Calculation',
  Criticality: #Negative
},
  {
    $Type      : 'UI.DataFieldForAction',
    Action     : 'ProcessorService.ga_op_calculation',
    Label      : 'Clear Payment Action',
    Determining: true,
    Criticality: #Negative
  }
]);

/*==========>> Button on ToolBar <<==========*/
// annotate ProcessorService.Incidents with @(UI.LineItem: [
//   {
//     $Type : 'UI.DataFieldForAction',
//     Action: 'ProcessorService.ta_lr_toolbarAction',
//     Label : 'Toolbar Action'
//   }
// ]);

/*==========>> Button as Column <<==========*/
annotate ProcessorService.Incidents with @(UI.LineItem: [
  {
    $Type      : 'UI.DataFieldForAction',
    Action     : 'ProcessorService.ta_lr_toolbarAction',
    Label      : 'Inline Action',
    Inline     : true,
    Criticality: #Positive
  }
]);
