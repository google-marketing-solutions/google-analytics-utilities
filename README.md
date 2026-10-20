## Google Analytics Utilities

This is not an officially supported Google product.

This repository contains an app script that can be used in combination with a Google Spreadsheet to save various information in bulk or individually about your Google Analytics 4 settings to a spreadsheet. 

If you find this tool useful, please consider leaving feedback by filling out this quick, anonymous [survey](https://docs.google.com/forms/d/e/1FAIpQLScHrZbNU2RZGMtcWTVVEsxe5ZzARFvjqFQziixNPUPCsNcUUQ/viewform).

The script currently performs the following functions:

| Resource                                                             | Capabilities                  |
|----------------------------------------------------------------------|-------------------------------|
| [Account Summaries](#account-summaries)                              | List                          |
| [Properties](#properties)                                            | List, Create, Delete, Update  |
| [Data Streams](#data-streams)                                        | List, Create, Delete, Update  |
| [Custom Dimensions](#custom-dimensions)                              | List, Create, Archive, Update |
| [Custom Metrics](#custom-metrics-1)                                  | List, Create, Archive, Update |
| [Calculated Metrics](#calculated-metrics)                            | List, Create, Archive, Update |
| [Key Events](#key-events)                                            | List, Create, Delete          |
| [Firebase Links](#firebase-links)                                    | List, Create, Delete          |
| [Google Ads Links](#google-ads-links)                                | List, Create, Delete, Update  |
| [DV360 Links](#dv360-links)                                          | List, Create, Delete, Update  |
| [Audiences Settings](#ga4-audiences)                                 | List, Create, Delete, Update  |
| [SA360 Links](#sa360-links)                                          | List, Create, Delete, Update  |
| [BigQuery Links](#bigquery-links)                                    | List                          |
| [User Access Bindings](#ga4-users)                                   | List, Create, Delete, Update  |
| [Settings Report](#settings-report)                                  | Create                        |
| [Expanded Data Sets](#expanded-data-sets)                            | List, Create, Delete, Update  |
| [Easy Property Creation](#easy-property-creation)                    | Create                        |
| [Channel Groups](#channel-groups)                                    | List, Create, Delete, Update  |
| [Measurement Protocol Secrets](#measurement-protocol-secrets)        | List, Create, Delete, Update  |
| [AdSense Links](#adsense-links)                                      | List, Create, Delete          |
| [Event Create Rules](#event-create-rules)                            | List, Create, Delete, Update  |
| [Audience Lists](#audience-lists)                                    | List, Create, Check, Export   |
| [Subproperty Event Filters](#subproperty-event-filters)              | List, Create, Delete, Update  |
| [Rollup Property Source Links](#rollup-property-source-links)        | List, Create, Delete          |
| [User Access Report](#user-access-report)                            | Create                        |
| [Annotations](#annotations)                                          | List, Create, Delete, Update  |
| [Custom Definitions Checker](#custom-definitions-checker)            | Create                        |


These tasks can be completed by [joining the Google Group](https://groups.google.com/g/google-analytics-utilities-users), [copying the template spreadsheet](https://docs.google.com/spreadsheets/d/1kJqwYNed8RTuAgjy0aRUooD__MIPqzUeiDF5LZ7v1aI/), and clicking on various options under the Google Analytics Utilities menu.

To access information about a given Analytics account, a user must have at least viewer permissions for the accounts, properties, and views they are interested in. If a user wants to create or update settings, they must have editor permissions.

All API requests are subject to the limitations [documented here](https://developers.google.com/analytics/devguides/config/mgmt/v3/limits-quotas).


## How to Access the Spreadsheet

It is strongly recommended that you use the template spreadsheet to use the Google Analytics Utilities script. Follow these steps to make a copy of the template spreadsheet and start using the script:



1. Join [this group](https://groups.google.com/g/google-analytics-utilities-users) to access the spreadsheet.
2. Create a copy of [this spreadsheet](https://docs.google.com/spreadsheets/d/1kJqwYNed8RTuAgjy0aRUooD__MIPqzUeiDF5LZ7v1aI/copy).

The spreadsheet is now ready to use the Google Analytics Utilities script. The first time you run a function from the menu, you will need to authorize the permissions for the script and then run the function a second time. You may see a warning that the script is unauthorized. You should be able to proceed anyway. The script does not collect any information.

### APIs and Access Permissions

The script makes use of the following APIs/advanced app script services:

* Google Analytics Admin API
* Google Analytics Data API
* Google Drive API
* BigQuery API

### Limited Scope Template

If you are concerned about the access permissions required for the script, then please use [this sheet instead](https://docs.google.com/spreadsheets/d/1NUUS0LLz2dlPB2-hLS5hgbLad9akwM4bqaeZGZy2RCQ/copy). This sheet lacks some of the more advanced features, but it has more restricted scopes.

## Features


### Color Coding

For the GA4 functions, whenever you check a box to archive/delete, create, or update, the sheet will highlight specific cells in each row that need to have values for the given setting to be modified or created. Please see additional details below:



* If a highlighted cell is empty, a row will remain white.
* When all the necessary fields have been entered to archive/delete a setting, the row will turn red.
* When all the necessary fields have been entered to create a setting, the row will turn green.
* When all the necessary fields have been entered to update a setting,  the row will turn blue.


### Action Taken Messages

If you archive, delete, create, or update a GA4 setting, then a corresponding action taken will be recorded in the same row. Errors will also be recorded in the "Action Taken" column. If you are missing a necessary value when trying to modify a setting, then that will likely be recorded in the "Action Taken" column taken. If you see "Error 404: HttpResponseException" then you are likely missing a value in the resource name column  (or the account ID column in the Property Details sheet) and should probably list your values again.


### Account Summaries


#### List



1. Navigate to "Account Summaries"
2. Click on Google Analytics Utilities > List Account Summaries. 
3. The script will identify all the Google Analytics 4 properties your email has access to and list a flattened table of accounts and properties in the "Account Summaries" sheet. 
    * This sheet can then be used to select specific accounts and properties for other functions.


### Properties


#### List



1. List GA4 account summaries.
2. Select each property for which you want to see details.
3. Navigate to the "Property Details" sheet.
4. Click on Google Analytics Utilities > Properties > List.
5. The selected property details will be listed in the "Property Details" sheet.


#### Create



1. Navigate to the "Property Details" sheet.
2. Each row represents a separate data stream. Enter the following information:
    1. Account ID
    2. Property name
    3. [Industry category](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties#IndustryCategory)
    4. [Time zone](https://www.iana.org/time-zones)
    5. [Currency code](https://en.wikipedia.org/wiki/ISO_4217)
    6. Data Retention Duration
        1. Note - The following values are only available for 360 properties:
            1. TWENTY_SIX_MONTHS
            2. THIRTY_EIGHT_MONTHS
            3. FIFTY_MONTHS
    7. Reset User Data on New Activity
    8. Check the box for "Create"
3. Click on Google Analytics Utilities > Properties > Modify.
4. The script will attempt to create the selected properties.


#### Delete



1. After listing your GA4 data streams, navigate to the "Property Details" sheet.
2. Select the data streams you want to delete.
3. Click on Google Analytics Utilities > Properties > Modify.
4. The script will attempt to delete the selected properties.


#### Update



1. After listing your GA4 data streams, navigate to the "Property Details" sheet.
2. Modify any of the following for a given property:
    1. Property Name
    2. Industry category
    3. Time zone
    4. Currency code
    5. Data Retention Duration
        1. Note - The following values are only available for 360 properties:
            1. TWENTY_SIX_MONTHS
            2. THIRTY_EIGHT_MONTHS
            3. FIFTY_MONTHS
    6. Reset User Data on New Activity 
3. Check the "Update" box for each property you want to update.
4. Click on Google Analytics Utilities > Properties > Modify.
5. The script will attempt to update the selected properties.


### Data Streams


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve data streams.
3. Navigate to the "Data Streams" sheet.
4. Click on Google Analytics Utilities > Data Streams > List.
5. The data streams for the selected properties will be listed in the "Data Streams" sheet.


#### Create



1. Navigate to the "Data Streams" sheet.
2. Each row represents a separate data stream. Enter the following information:
    1. Property ID
    2. Stream Name
    3. Stream type: 
        1. WEB_DATA_STREAM
            1. Enter the relevant Enhanced Measurement Settings
            2. Enter the default URI
        2. ANDROID_APP_DATA_STREAM
            3. Enter package ID
        3. IOS_APP_DATA_STREAM
            4. Enter bundle ID
    4. Check the box for "Create"
3. Click on Google Analytics Utilities > Data Streams > Modify.
4. The script will attempt to create the selected data streams.


#### Delete



1. After listing your GA4 data streams, navigate to the "Data Streams" sheet.
2. Select the data streams you want to delete.
3. Click on Google Analytics Utilities > Data Streams > Modify.
4. The script will attempt to delete the selected data streams.


#### Update



1. After listing your GA4 data streams, navigate to the "Data Streams" sheet.
2. Enter a new stream name for a given data stream.
    1. If the the stream type is WEB_DATA_STREAM, then you can enter the relevant Enhanced Measurement Settings
3. Check the "Update" box for each data stream you want to update.
4. Click on Google Analytics Utilities > Data Streams > Modify.
5. The script will attempt to update the selected data streams.


### Custom Dimensions


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve custom dimensions.
3. Navigate to the "Custom Dimensions" sheet.
4. Click on Google Analytics Utilities > Custom Dimensions > List.
5. The custom dimensions for the selected properties will be listed in the "Custom Dimensions" sheet.


#### Create



1. Navigate to the "Custom Dimensions" sheet.
2. Enter the following:
    1. Property ID
    2. Custom dimension name (the name displayed in the UI)
    3. Parameter name (the name collected in the code/tags)
    4. [Scope](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.customDimensions#DimensionScope)
    5. Description
    6. Whether or not ads personalization is disallowed (true or false)
    7. Check the box for "Create"
    8. Repeat these steps in a new row for each custom dimension you want to create
3. Click on Google Analytics Utilities > Custom Dimensions > Modify.
4. The script will attempt to create the selected custom dimensions.


#### Archive



1. After listing your GA4 custom dimensions, navigate to the "Custom Dimensions" sheet.
2. Check the "Archive" box for each custom dimension you want to archive.
3. Click on Google Analytics Utilities > Custom Dimensions > Modify.
4. The script will attempt to archive the selected custom dimensions.


#### Update



1. After listing your GA4 custom dimensions, navigate to the "Custom Dimensions" sheet.
2. Enter a new custom dimension name or description for a given custom dimension.
3. Check the "Update" box for each custom dimension you want to update.
4. Click on Google Analytics Utilities > Custom Dimensions > Modify.
5. The script will attempt to update the selected custom dimensions.


### Custom Metrics


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve custom dimensions.
3. Navigate to the "Custom Metrics" sheet.
4. Click on Google Analytics Utilities > Custom Metrics > List.
5. The custom dimensions for the selected properties will be listed in the "Custom Metrics" sheet.


#### Create



1. Navigate to the "Custom Metrics" sheet.
2. Enter the following:
    1. Property ID
    2. Custom metric name (the name displayed in the UI)
    3. Parameter name (the name collected in the code/tags)
    4. [Scope](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.customMetrics#MetricScope)
    5. [Measurement Unit](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.customMetrics#MeasurementUnit)
    6. Description
    7. Check the box for "Create"
    8. Repeat these steps in a new row for each custom metric you want to create
3. Click on Google Analytics Utilities > Custom Metrics > Modify.
4. The script will attempt to create the selected custom metrics.


#### Archive



1. After listing your GA4 custom metrics, navigate to the "Custom Metrics" sheet.
2. Check the "Archive" box for each custom metric you want to archive.
3. Click on Google Analytics Utilities > Custom Metrics > Modify.
4. The script will attempt to archive the selected custom metrics.


#### Update



1. After listing your GA4 custom metrics, navigate to the "Custom Metrics" sheet.
2. Enter a new custom metric name, description, or measurement unit for a given custom metric.
3. Check the "Update" box for each custom metric you want to update.
4. Click on Google Analytics Utilities > Custom Metrics > Modify.
5. The script will attempt to update the selected custom metrics.


### Calculated Metrics


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve custom dimensions.
3. Navigate to the "Calculated Metrics" sheet.
4. Click on Google Analytics Utilities > Calculated Metrics > List.
5. The custom dimensions for the selected properties will be listed in the "Calculated Metrics" sheet.


#### Create



1. Navigate to the "Calculated Metrics" sheet.
2. Enter the following:
    1. Property ID
    2. Calculated metric name (the name displayed in the UI)
    3. Optional: Description
    4. Metric Unit
    5. Formula
    6. Check the box for "Create"
    7. Repeat these steps in a new row for each custom metric you want to create
3. Click on Google Analytics Utilities > Caluclated Metrics > Modify.
4. The script will attempt to create the selected calculated metrics.


#### Delete



1. After listing your GA4 calculated metrics, navigate to the "Calculated Metrics" sheet.
2. Check the "Delete" box for each calculated metric you want to archive.
3. Click on Google Analytics Utilities > Calculated Metrics > Modify.
4. The script will attempt to delete the selected calculated metrics.


#### Update



1. After listing your GA4 calculated metrics, navigate to the "Calculated Metrics" sheet.
2. Enter a new calculated metric name, description, or metric unit for a given calculated metric.
3. Check the "Update" box for each calculated metric you want to update.
4. Click on Google Analytics Utilities > Calculated Metrics > Modify.
5. The script will attempt to update the selected custom metrics.


### Key Events


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve key events.
3. Navigate to the "Key Events" sheet.
4. Click on Google Analytics Utilities > Key Events > List.
5. The key events for the selected properties will be listed in the "Key Events" sheet.


#### Create



1. Navigate to the "Key Events" sheet.
2. Enter the following:
    1. Property ID
    2. Event name
    3. Check the box for "Create"
    4. Repeat these steps in a new row for each key event you want to create
3. Click on Google Analytics Utilities > Key Events > Modify.
4. The script will attempt to create a new key event based on the information in each row.


#### Delete



1. After listing your GA4 key events, navigate to the "Key Events" sheet.
2. Check the "Delete" box for each key event you want to delete.
3. Click on Google Analytics Utilities > Key Events > Modify.
4. The script will attempt to delete the selected key events.


### Firebase Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve Firebase links.
3. Navigate to the "Firebase Links" sheet.
4. Click on Google Analytics Utilities > Firebase Links > List.
5. The Firebase links for the selected properties will be listed in the "Firebase Links" sheet.


#### Create



1. Navigate to the "Firebase Links" sheet.
2. Enter the following:
    1. Property ID
    2. Firebase project ID or name
    3. Check the box for "Create"
    4. Repeat these steps in a new row for each Firebase link you want to create
3. Click on Google Analytics Utilities > Firebase Links > Modify.
4. The script will attempt to create a new Firebase link based on the information in each row.


#### Delete



1. After listing your GA4 firebase links, navigate to the "Firebase Links" sheet.
2. Check the "Delete" box for each Firebase link you want to delete.
3. Click on Google Analytics Utilities > Firebase Links > Modify.
4. The script will attempt to delete the selected Firebase links.


### Google Ads Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve Google Ads links.
3. Navigate to the "Google Ads Links" sheet.
4. Click on Google Analytics Utilities > Links > Google Ads > List.
5. The Google Ads links for the selected properties will be listed in the "Google Ads Links" sheet.


#### Create



1. Navigate to the "Google Ads Links" sheet.
2. Enter the following:
    1. Property ID
    2. Google Ads client ID
    3. True or false for "Ads Personalization Enabled"
    4. Check the box for "Create"
    5. Repeat these steps in a new row for each Google Ads link you want to create
3. Click on Google Analytics Utilities > Links > Google Ads > Modify.
4. The script will attempt to create a new Google Ads link based on the information in each row.


#### Delete



1. After listing your GA4 Google Ads links, navigate to the "Google Ads Links" sheet.
2. Check the "Delete" box for each Google Ads link you want to delete.
3. Click on Google Analytics Utilities > Links > Google Ads > Modify.
4. The script will attempt to delete the selected Google Ads links.


#### Update



1. After listing your GA4 Google Ads links, navigate to the "Google Ads Links" sheet.
2. Enter true or false for "Ads Personalization Enabled"
3. Check the "Update" box for each Google Ads link you want to update.
4. Click on Google Analytics Utilities > Links > Google Ads > Modify.
5. The script will attempt to update the selected Google Ads links.


### DV360 Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve DV360 links.
3. Navigate to the "DV360 Links" sheet.
4. Click on Google Analytics Utilities > Links > DV360 > List.
5. The DV360 links for the selected properties will be listed in the "DV360 Links" sheet.


#### Create



1. Navigate to the "DV360 Links" sheet.
2. Enter the following:
    1. Property ID
    2. Advertiser ID
    3. True or false for "Ads Personalization Enabled"
    4. True or false for "Campaign Data Sharing Enabled"
    5. True or false for "Cost Data Sharing Enabled"
    6. Check the box for "Create"
    7. Repeat these steps in a new row for each DV360 link you want to create
3. Click on Google Analytics Utilities > Links > DV360 > Modify.
4. The script will attempt to create a new DV360 link based on the information in each row.


#### Delete



1. After listing your GA4 DV360 links, navigate to the "DV360 Links" sheet.
2. Check the "Delete" box for each DV360 link you want to delete.
3. Click on Google Analytics Utilities > Links > DV360 > Modify.
4. The script will attempt to delete the selected DV360 links.


#### Update



1. After listing your GA4 DV360 links, navigate to the "DV360 Links" sheet.
2. Enter true or false for "Ads Personalization Enabled"
3. Check the "Update" box for each DV360 link you want to update.
4. Click on Google Analytics Utilities > Links > DV360 > Modify.
5. The script will attempt to update the selected DV360 links.


### GA4 Audiences


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve audiences.
3. Navigate to the "Audiences" sheet.
4. Click on Google Analytics Utilities > Audiences > List.
5. The audiences for the selected properties will be listed in the "Audiences" sheet.


#### Create



1. Navigate to the "Audiences" sheet.
2. Enter the following:
    1. Property ID
    2. Audience Name
    3. Audience Description
    4. Membership Duration
    5. Filter Clauses
    6. (Optional) Event Trigger Name
    7. (Optional) Event Trigger Log Condition
    8. (Only set with exclusion filter conditions) Exclusion Duration Mode
    9. Repeat these steps in a new row for each audience you want to create
3. Click on Google Analytics Utilities > Audiences > Modify.
4. The script will attempt to create a new audience based on the information in each row.


#### Delete



1. After listing your GA4 audiences, navigate to the "Audiences" sheet.
2. Check the "Delete" box for each audience link you want to delete.
3. Click on Google Analytics Utilities > Audiences > Modify.
4. The script will attempt to delete the selected audiences.


#### Update



1. After listing your GA4 audiences, navigate to the "Audiences" sheet.
2. The following can be updated:
    1. Audience Name
    2. Audience Description
3. Check the "Update" box for each audience you want to update.
4. Click on Google Analytics Utilities > Audience > Modify.
5. The script will attempt to update the selected audience.


### SA360 Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve SA360 links.
3. Navigate to the "SA360 Links" sheet.
4. Click on Google Analytics Utilities > Links > SA360 > List.
5. The SA360 links for the selected properties will be listed in the "SA360 Links" sheet.


#### Create



1. Navigate to the "SA360 Links" sheet.
2. Enter the following:
    1. Property ID
    2. Advertiser ID
    3. True or false for "Ads Personalization Enabled"
    4. True or false for "Campaign Data Sharing Enabled"
    5. True or false for "Cost Data Sharing Enabled"
    6. True or false for "Site States Sharing Enabled"
    7. Check the box for "Create"
    8. Repeat these steps in a new row for each SA360 link you want to create
3. Click on Google Analytics Utilities > Links > SA360 > Modify.
4. The script will attempt to create a new SA360 link based on the information in each row.


#### Delete



1. After listing your GA4 SA360 links, navigate to the "SA360 Links" sheet.
2. Check the "Delete" box for each SA360 link you want to delete.
3. Click on Google Analytics Utilities > Links > SA360 > Modify.
4. The script will attempt to delete the selected SA360 links.


#### Update



1. After listing your GA4 SA360 links, navigate to the "SA360 Links" sheet.
2. Edit the following:
    1. Enter true or false for "Ads Personalization Enabled"
    2. Enter true or false for "Site States Sharing Enabled"
3. Check the "Update" box for each SA360 link you want to update.
4. Click on Google Analytics Utilities > Links > SA360 > Modify.
5. The script will attempt to update the selected SA360 links.


### BigQuery Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve BigQuery links.
3. Navigate to the "BigQuery Links" sheet.
4. Click on Google Analytics Utilities > Links > BigQuery > List.
5. The BigQuery links for the selected properties will be listed in the "BigQuery Links" sheet.


### Expanded Data Sets


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve expanded data sets.
3. Navigate to the "Expanded Data Sets" sheet.
4. Click Google Analytics Utilities > Expanded Data Sets > List.
5. Expanded data sets for the selected properties will be listed in the "Expanded Data Sets" sheet.


#### Create



1. Navigate to "Expanded Data Sets".
2. Enter the following for each expanded data set you want to create:
    1. Property ID
    2. Expanded data set name
    3. Description (optional)
    4. A comma separated list of dimension names
    5. A comma separated list of metric names
    6. A filter expression (optional)
    7. Check the "Create" box
3. Click Google Analytics Utilities > Expanded Data Sets > Modify.
4. The script will attempt to create new expanded data sets. NOTE: The script will not validate if a given combination of dimensions and metrics can be used in an expanded data set.


#### Update



1. List your expanded data sets.
2. Navigate to "Expanded Data Sets".
3. Modify the following for each expanded data set you want to update:
    1. Display Name
    2. Description
    3. Check the "Update" box
4. Click Google Analytics Utilities > Expanded Data Sets > Modify.
5. The script will attempt to update the expanded data sets.


#### Delete



1. List your expanded data sets.
2. Navigate to "Expanded Data Sets".
3. Check the "Delete" box for the expanded data sets you want to delete.
4. Click Google Analytics Utilities > Expanded Data Sets > Modify.
5. The script will attempt to delete the expanded data sets.


### GA4 Users


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve access bindings.
3. Navigate to the "Users" sheet.
4. Click on Google Analytics Utilities > Users > List.
5. The access bindings for the selected properties will be listed in the "Users" sheet. Access bindings will only be displayed if the user requesting the information has the necessary permissions. If possible, the access bindings for the accounts associated with each property will also be listed.


#### Create



1. Navigate to the "Users" sheet.
2. Enter the following in a new row:
    1. Account Access Binding:
        1. Account ID
        2. User Email
        3. Primary permissions - Must be one of the following:
            1. predefinedRoles/viewer
            2. predefinedRoles/analyst
            3. predefinedRoles/editor
            4. predefinedRoles/admin
        4. Secondary Permissions - Can be one of the following:
            5. Blank
            6. predefinedRoles/no-cost-data
            7. predefinedRoles/no-revenue-data
            8. predefinedRoles/no-cost-data, predefinedRoles/no-revenue-data
    2. Property Access Binding:
        5. Account ID
        6. Property ID
        7. User Email
        8. Primary permissions - Must be one of the following:
            9. predefinedRoles/viewer
            10. predefinedRoles/analyst
            11. predefinedRoles/editor
            12. predefinedRoles/admin
        9. Secondary Permissions - Can be one of the following:
            13. Blank
            14. predefinedRoles/no-cost-data
            15. predefinedRoles/no-revenue-data
            16. predefinedRoles/no-cost-data, predefinedRoles/no-revenue-data
3. Check the "Create" box for the row.
4. Click on Google Analytics Utilities > Users > Modify.
5. The script will attempt to create a new access binding based on the information in each row. Batching is not used.


#### Delete



1. After listing your GA4 access bindings, navigate to the "Users" sheet.
2. Check the "Delete" box for each access binding you want to delete.
3. Click on Google Analytics Utilities > Users > Modify.
4. The script will attempt to delete the selected access bindings. Batching is not used.


#### Update



1. After listing your GA4 access bindings, navigate to the "Users" sheet.
2. The following can be updated:
    1. Primary Permissions
    2. Secondary Permissions
3. Check the "Update" box for each access binding you want to update.
4. Click on Google Analytics Utilities > Users > Modify.
5. The script will attempt to update the selected access bindings. Batching is not used.


### GA4 Settings Report


#### Create a Report



1. List GA4 account summaries.
2. Select the properties for which you want to generate a report.
3. Navigate to the "Report Settings" sheet.
4. Enter the information as indicated for rows 4-9.
    1. If the "Template Slides URL" value is left as "Default" or is blank, then the default template will be used. Otherwise, a Google Slides URL of a template presentation must be provided.
    2. If the box for "Request New Settings Information" is checked, then GA Utilities will automatically list new information for several different GA4 sheets. This newly listed information will clear any existing settings listed in the sheets. This includes the following sheets: 
        1. GA4 Property Details
        2. GA4 Audiences
        3. GA4 Data Streams
        4. GA4 Key Events
        5. GA4 Custom Dimensions
        6. GA4 Custom Metrics
        7. GA4 Google Ads Links
        8. GA4 DV360 Links
        9. GA4 Firebase Links
5. The placeholder rows starting at row 10 can be added to, removed, or changed as you prefer. Each column works in the following way:
    1. **Placeholder Text:** This is the placeholder text found in the template spreadsheet. Each placeholder text can only be used once per slide. A placeholder can be whatever you want, but the behavior of the script will change if any of the following words are used:
        1. **percent**: If the word "percent" (all in lowercase) is used in the placeholder, then the value in the slide will be properly formatted as a percent and will change color depending on the information entered for the percent range color scale. The value in the spreadsheet must be a number.
        2. **image, graphic, or logo**: If the image, graphic, or logo (all lowercase) are used in the placeholder, then the value must be a URL that points to an image. The script will then try to swap out the placeholder in the template with the image from the URL.
        3. **list**: If the word "list" is used in the placeholder, then the script will try to create a bulleted list in the slide based on the value in the spreadsheet. The value in the spreadsheet will be split by the presence of double semicolons (;;). For example, the following would be split into two bullet points: <code><em>hello, world;;example list</em></code>. You can either construct a list value in a single line, or you can have multiple rows with the exact same placeholder name and the script will create a list for you from those rows. 
    2. <strong>Template Slide</strong>: The template slide column is used to determine which slide a given placeholder text belongs to. The template slide text must exist in the speaker notes section for a given slide in order for the script to identify the correct slide.
    3. <strong>Include</strong>: Either check the box or use a formula to determine if a placeholder should be considered when building the final presentation.
    4. <strong>Value</strong>: The final value that will appear on the slide where the placeholder text is present.
6. If your template includes one or more slides that need to be duplicated, then you must navigate to the "Report Settings - Snapshot" sheet and enter settings for those slides. This sheet can be customized in the following way:
    1. Column A: Contains the property ID for a given GA4 property and is included to make it easier to create formulas in other columns.
    2. Column B: Contains the template slide placeholder and is used to identify the template slide.
    3. Columns C+: The headers for these columns should contain the placeholder text that will be swapped with a real value when the report is complete.  Every row after the header should have a value for that specific property. These values can be derived from the other GA Utilities sheets or entered as plain text. The placeholder name rules are the same as previously stated: percent formats the number value as a percent on the slide, list creates a bulleted list, image/graphic/logo uses a provided URL as an image, and any other name just replaces the value on the slide as is.
7. Once all values have been entered, click GA Utilities > Advanced > Health Report > Create Report
8. Once the health report has been created, a link to the report and the date of its creation will be appended to columns F and G in the "Report Settings" sheet. The date of creation will default to MM-DD-YYYY format, but that can be reformatted if you so wish.
9. Review the new report and make any necessary adjustments. There may be some placeholders that aren’t removed if said placeholder was not included in the sheet but was present in the template. This is expected and you should delete the placeholder manually. You may also need to adjust image sizes, which is expected.


### Easy Property Creation


#### List



1. List GA4 account summaries.
2. Select the properties you want to use as templates.
3. Navigate to the "Easy Property Creation" sheet.
4. Click on Google Analytics Utilities > Advanced > Easy Property Creation > List Templates.
5. The selected properties and many of their associated settings will be listed in the "Easy Property Creation" sheet.


#### Create



1. Navigate to the "Easy Property Creation" sheet.
2. Enter the following in the row for the property you want to make a copy of. If necessary, you can make copy the property settings into multiple rows:
    1. Account ID for New Property 
    2. New Property Name
3. (Optional) If necessary, edit, add, or remove any of the settings in the various columns.
4. Check the "Create" box for each row you want to use to make a property.
5. Click on Google Analytics Utilities > Advanced > Easy Property Creation > Create Properties.
6. The script will attempt to create a new property for each selected row and will also create the various settings (i.e. data streams, audiences, key events, etc.) in the columns. **Note: Due to limitations with the API, Google Signals will not be enabled in the newly created properties even if the template properties had Google Signals enabled.**


### Channel Groups


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve channel groups.
3. Navigate to the "Channel Groups" sheet.
4. Click Google Analytics Utilities > Channel Groups > List.
5. Channel Groups for the selected properties will be listed in the "Channel Groups" sheet.


#### Create



1. Navigate to "Channel Groups".
2. Enter the following for each channel group you want to create:
    1. Property ID
    2. Channel group name
    3. Description (optional)
    4. Grouping rule as defined [here](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.channelGroups#GroupingRule)
    5. Check the "Create" box
3. Click Google Analytics Utilities > Channel Groups > Modify.
4. The script will attempt to create new channel groups.

#### Update



1. List your channel groups.
2. Navigate to "Channel Groups".
3. Modify the following for each channel group you want to update:
    1. Channel Group Name
    2. Description
    3. Grouping rule
    4. Check the "Update" box
4. Click Google Analytics Utilities > Channel Groups > Modify.
5. The script will attempt to update the channel groups.


#### Delete



1. List your channel groups.
2. Navigate to "Channel Groups".
3. Check the "Delete" box for the channel groups you want to delete.
4. Click Google Analytics Utilities > Channel Groups > Modify.
5. The script will attempt to delete the channel groups.



### Measurement Protocol Secrets


#### List



1. List GA4 account summaries.
2. Select the properties for which you want to list their data streams.
3. Navigate to "Data Stream Selection".
4. Click Google Analytics Utilities > List Data Stream Selection.
5. Select the data streams for which you want to list their measurement protocol secrets.
6. Click Google Analytics Utilities > Measurement Protocol Secrets > List.
7. Measurement Protocol Secrets for the selected data streams will be listed in the "Measurement Protocol Secrets" sheet.


#### Create



1. Navigate to "Measurement Protocol Secrets".
2. Enter the following for each measurement protocol secret you want to create:
    1. Property ID
    2. Data Stream ID
    3. Measurement Protocol Secret Name
    4. Check the "Create" box
3. Click Google Analytics Utilities > Measurement Protocol Secrets > Modify.
4. The script will attempt to create new measurement protocol secrets.

#### Update



1. List your measurement protocol secrets.
2. Navigate to "Measurement Protocol Secrets".
3. Modify the following for each measurement protocol secret you want to update:
    1. Measurement Protocol Secret Name
    2. Check the "Update" box
4. Click Google Analytics Utilities > Measurement Protocol Secrets > Modify.
5. The script will attempt to update the measurement protocol secrets.


#### Delete



1. List your measurement protocol secrets.
2. Navigate to "Measurement Protocol Secrets".
3. Check the "Delete" box for the measurement protocol secrets you want to delete.
4. Click Google Analytics Utilities > Measurement Protocol Secrets > Modify.
5. The script will attempt to delete the measurement protocol secrets.


### AdSense Links


#### List



1. List GA4 account summaries.
2. Select the properties from which you want to retrieve AdSense Links.
3. Navigate to the "AdSense Links" sheet.
4. Click Google Analytics Utilities > Links > AdSense > List.
5. AdSense links for the selected properties will be listed in the "AdSense Links" sheet.


#### Create



1. Navigate to "AdSense Links".
2. Enter the following for each AdSense link you want to create:
    1. Property ID
    2. Ad Client ID
    5. Check the "Create" box
3. Click Google Analytics Utilities > Links > AdSense > Modify.
4. The script will attempt to create new AdSense links.


#### Delete



1. List your AdSense links.
2. Navigate to "AdSense Links".
3. Check the "Delete" box for the AdSense links you want to delete.
4. Click Google Analytics Utilities > Links > AdSense > Modify.
5. The script will attempt to delete the AdSense links.


### Event Create Rules


#### List



1. List GA4 account summaries.
2. Select the properties for which you want to list their data streams.
3. Navigate to "Data Stream Selection".
4. Click Google Analytics Utilities > List Data Stream Selection.
5. Select the data streams for which you want to list their event create rules.
6. Click Google Analytics Utilities > Event Create Rules > List.
7. Event Create Rules for the selected data streams will be listed in the "Event Create Rules" sheet.


#### Create



1. Navigate to "Event Create Rules".
2. Enter the following for each event create rule you want to create:
    1. Property ID
    2. Data Stream ID
    3. Destination Event Name
    4. (Optional) Copy Source Parameters
    5. (Optional) Event Conditions
    6. (Optional) Parameter Mutations
    7. Check the "Create" box
3. Click Google Analytics Utilities > Event Create Rules > Modify.
4. The script will attempt to create new event create rules.

#### Update



1. List your event create rules.
2. Navigate to "Event Create Rules".
3. Modify the following for each event create rule you want to update:
    1. Destination Event Name
    2. (Optional) Copy Source Parameters
    3. (Optional) Event Conditions
    4. (Optional) Parameter Mutations
    2. Check the "Update" box
4. Click Google Analytics Utilities > Event Create Rules > Modify.
5. The script will attempt to update the event create rules.


#### Delete



1. List your event create rules.
2. Navigate to "Event Create Rules".
3. Check the "Delete" box for the event create rules you want to delete.
4. Click Google Analytics Utilities > Event Create Rules > Modify.
5. The script will attempt to delete the event create rules.


### Audience Lists


#### List



1. List GA4 account summaries.
2. Select the properties for which you want to list audience lists.
3. Navigate to the "Audience Lists" sheet.
4. Click Google Analytics Utilities > Advanced > Audience Lists > List Audience Lists.
5. The Audience Lists for the selected properties will be listed in the "Audience Lists" sheet.


#### Create



1. Navigate to "Audience Lists".
2. Enter the following for each event create rule you want to create. It is suggesteed that you click Google Analytics Utilities > Advanced > Audience Lists > List Existing Audiences to list the following information automatically in your sheet:
    1. Property ID
    2. Audience Resource Name
    3. A comma separated list of dimensions (E.g. deviceId, userId)
    4. Check the "Create" box
3. Click Google Analytics Utilities > Advanced > Audience Lists > Create Audience Lists.
4. The script will attempt to create audience lists.

#### Check State

To check the state of your audience lists, you can either list the audience lists in a property or retrieve the state for a single audience list by going through the following steps.

1. Navigate to "Audience Lists".
2. Enter the following for each audience list you want to check:
    1. Audience List Resource Name
    2. Check the "Check State" box
3. Click Google Analytics Utilities > Advanced > Audience Lists > Check Audience List States.
5. The script will attempt to check the state for the selected audience lists.


#### Export

Currently, the Google Anaytics Utilities can export audience list dimensions either to a new spreadsheet, and existing spreadsheet, or an existing empty BigQuery table. It is not recommended that you try to export more than 100 - 150 thousand users total at one time across all of your audience lists selected for export. If you choose more than this, the scritp may throw an error and fail to properly export the users in one or more audience lists.

1. Navigate to "Audience Lists".
2. List your audience lists by clicking on Google Analytics Utilities > Advanced > Audience Lists > List Audience Lists.
3. For a given audience, make sure the following is entered:
    1. Audience List Resource Name
    2. Output Location is set to either "Spreadsheet" or "BigQuery"
    3. If the output location is "Spreadsheet":
        1. If you want to export to a new spreadsheet, check the new spreadsheet box
        2. If you want to export to an existing spreadsheet, leave the new spreadsheet box unchecked and enter the URL for the new spreadsheet.
    4. If the output location is "BigQuery":
        1. Enter the existing project and dataset names.
        2. Enter the name for new table that will be created by the script and poplulated with the audience export data. The table should not already exist in BigQuery.
    5. Check the "Export" box
4. Click Google Analytics Utilities > Advanced > Audience Lists > Export Audience Lists.
5. The script will attempt to export the audience lists users to a the chosen export locations. As indicated above, if the audience lists are too large, the export may fail.


### Subproperty Event Filters

#### List

1. List GA4 account summaries.
2. Select the properties for which you want to list their subproperty filter events.
3. Navigate to "Subproperty Filter Events".
4. Click Google Analytics Utilities > Subproperty Filter Events > List.
5. Subproperty event filters for the selected properties will be listed in the "Subproperty Event Filters" sheet.


#### Create

1. Navigate to "Subproperty Event Filters".
2. Enter the following for each subproperty event filter you want to create:
    1. Property ID (this is the parent property)
    2. Apply to property (this is the subproperty the filter will be applied to)
    3. Filter clauses
    4. Check the "Create" box
3. Click Google Analytics Utilities > Subproperty Event Filters > Modify.
4. The script will attempt to create new subproperty event filters.

#### Update

1. List your subproperty event filters.
2. Navigate to "Subproperty Event Filters".
3. Modify the following for each subproperty event filter you want to update:
    1. Filter clauses
    2. Check the "Update" box
4. Click Google Analytics Utilities > Subproperty Event Filters > Modify.
5. The script will attempt to update the subproperty event filters.

#### Delete

1. List your subproperty event filters.
2. Navigate to "Subproperty Event Filters".
3. Check the "Delete" box for the subproperty event filters you want to delete.
4. Click Google Analytics Utilities > Subproperty Event Filters > Modify.
5. The script will attempt to delete the subproperty event filters.


### Rollup Property Source Links

#### List

1. List GA4 account summaries.
2. Select the properties for which you want to list their rollup property source links.
3. Navigate to "Rollup Property Source Links".
4. Click Google Analytics Utilities > Rollup Property Source Links > List.
5. Rollup property source links for the selected properties will be listed in the "Rollup Property Source Links" sheet.


#### Create

1. Navigate to "Rollup Property Source Links".
2. Enter the following for each rollup property source link you want to create:
    1. Property ID (this is the rollup property)
    2. Source Link ID (this is the property ID for the source property in the format properties/ID_NUMBER)
    3. Check the "Create" box
3. Click Google Analytics Utilities > Rollup Property Source Links > Modify.
4. The script will attempt to create new rollup property source links.

#### Delete

1. List your rollup property source links.
2. Navigate to "Rollup Property Source Links".
3. Check the "Delete" box for the rollup property source links you want to delete.
4. Click Google Analytics Utilities > Rollup Property Source Links > Modify.
5. The script will attempt to delete the rollup property source links.

### User Access Report

#### Create

1. List GA4 account summaries.
2. Select the properties for which you want to run user access reports. If you want to run reports for accounts, select one row for a given account.
3. Navigate to the "User Access Report Settings" sheet.
4. Enter the settings for the reports you want to run.
    - Enter the start date for the report.
    - Enter the end date for the report.
    - Optional: Enter a second start and end data for the report.
    - Select the dimensions you want to include in the report. You can select up to 9 dimensions.
    - Select the metrics you want to include in the report. You can select up to 10 metrics.
    - Optional: Set the report offset.
    - Optional: Set the report limit (defaults to 10000 if not set).
    - Set the time zone for the report.
    - Optional: Include all users by checking the box.
    - Optional: Expand user groups. This is only an option if you check the box for include all users.
    - The "Account Level Report" setting specifies if you are running access reports at the account level or property level. If you leave the box unchecked, then a property level user access report will be run for each of the properties you selected in step 2. If you check the box, then account level user access reports will be run for each of properties you selected in step 2. If multiple rows were selected that contain the same account, only one user access report will be run for said account.
5. Click Google Analytics Utilities > Advanced > User Access Report > Run Report.
6. The script will attempt to run a user access report for each of the properties or accounts you selected. The results will be written to the "User Access Report" sheet. Please note that the information in the "User Access Report" will be cleared whenever a new report is run.



### Annotations

#### List

1. List GA4 account summaries.
2. Select the properties for which you want to list their annotations
3. Navigate to "Annotations".
4. Click Google Analytics Utilities > Annotations > List.
5. Annotations for the selected properties will be listed in the "Annotations" sheet.


#### Create

1. Navigate to "Annotations".
2. Enter the following for each Annotations you want to create:
    1. Property ID (this is the parent property)
    2. Annotations Title
    3. Color
    4. Start Date (and optional end date if you want)
3. Click Google Analytics Utilities > Annotations > Modify.
4. The script will attempt to create new Annotations

#### Update

1. List your Annotations.
2. Navigate to "Annotations".
3. Modify the following for Annotations you want to update:
    1. Annotations title, Description, Color, Start Date, End Date
    2. Check the "Update" box
4. Click Google Analytics Utilities > Annotations > Modify.
5. The script will attempt to update the Annotations

#### Delete

1. List your Annotations.
2. Navigate to "Annotations".
3. Check the "Delete" box for the Annotations you want to delete.
4. Click Google Analytics Utilities > Annotations > Modify.
5. The script will attempt to delete the Annotations.

### Custom Definitions Checker

The Custom Definitions Checker lists the custom dimensions and custom metrics of the selected properties together with the number of events that collected each of them in the last 30 days (ending yesterday). Use it to find custom definitions that are registered but are not collected at all.

#### Create

1. List GA4 account summaries.
2. Select the properties you want to check.
3. Navigate to the "Custom Dimensions Checker" (or "Custom Metrics Checker") sheet.
4. Click Google Analytics Utilities > Advanced > Custom Definitions Checker > Check Custom Dimensions (or Check Custom Metrics).
5. The custom dimensions (or custom metrics) of the selected properties will be listed in the sheet. Please note that the information in the sheet will be cleared whenever the report is run again.

How the "Event Count (Last 30 Days)" column is calculated:

- Event-scoped custom dimensions: the number of events where the custom dimension had a value other than "(not set)".
- User-scoped custom dimensions: the number of events of users who had the user property set.
- Item-scoped custom dimensions: GA4 doesn't allow item-scoped dimensions to be combined with the event count, so this is the number of item units where the custom dimension had a value in the view_item_list, select_item, view_promotion, select_promotion, view_item, add_to_cart, begin_checkout and purchase events. The "Top Events (Event Count)" column shows the item units per event. Item-scoped custom dimensions that are only sent with other events (for example add_to_wishlist or remove_from_cart) are not counted.
- Custom metrics: the number of events of the event names that recorded a non-zero value for the custom metric. GA4 doesn't report whether a metric was sent with each individual event, so this is an upper bound. The "Total Value (Last 30 Days)" column contains the sum of the custom metric.

The "Status" column is one of:

- "Collected" or "Not collected".
- "None defined" if the property has no custom dimensions (or custom metrics).
- "Error" if the definition couldn't be checked. The reason is written to the "Notes" column.
- "Not checked" if the report stopped early to stay within the Apps Script time limit. Select fewer properties and run the report again.

Please note:

- GA4 only collects data for a custom definition after it has been created, so definitions created in the last 30 days will have lower counts.
- The checker sends one [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas) request per custom definition, which counts towards the property's Data API quota.
