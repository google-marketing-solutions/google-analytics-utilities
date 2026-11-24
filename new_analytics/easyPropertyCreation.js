/**
 * Copyright 2023 Google LLC
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     https://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 
 */
function isEmptyObject(obj) {
  if (obj) {
    return Object.keys(obj).length === 0;
  } else {
    true;
  }
}

/**
 * Gets the GA4 settings for the features for an array of properties and returns
 * a double array.
 * @param {!Array<!Object>} properties
 */
function listAllFeatureSettings(properties) {
  const data = [];
  if (properties.length > 0) {
    properties.forEach(property => {
      const accountName = property[0];
      const accountId = property[1];
      const propertyName = property[2];
      const propertyId = property[3];
      const propertyResourceName = 'properties/' + propertyId;
      const attributionSettings = getGA4Resource(
        'attributionSettings', 
        `${propertyResourceName}/attributionSettings`);
      const dataRetentionSettings = getGA4Resource(
        'dataRetentionSettings',
        `${propertyResourceName}/dataRetentionSettings`);
      const dataStreams = listGA4Entities(
        'streams', propertyResourceName).dataStreams;
      if (dataStreams) {
        dataStreams.forEach(stream => {
          if (stream.webStreamData) {
            stream.webStreamData.enhancedMeasurementSettings = getGA4Resource(
              'enhancedMeasurementSettings',
              `${stream.name}/enhancedMeasurementSettings`);
          }
          stream.measurementProtocolSecrets = listGA4Entities(
            'measurementProtocolSecrets', stream.name
          ).measurementProtocolSecrets;
          stream.eventCreateRules = listGA4Entities(
            'eventCreateRules', stream.name).eventCreateRules;
        });
      }
      let audiencesExist = false;
      const audiences = listGA4Entities(
        'audiences', propertyResourceName).audiences;
      if (audiences) {
        audiencesExist = true;
      }
      data.push([
        accountName,
        accountId,
        propertyName,
        propertyId,
        '', '',
        JSON.stringify(cleanOutput('properties',
          getGA4Resource('properties', propertyResourceName)), null, 2),
        JSON.stringify(cleanOutput(
          'data retention',dataRetentionSettings), null, 2),
        JSON.stringify(cleanOutput(
          'attribution', attributionSettings), null, 2),
        audiencesExist,
        JSON.stringify(cleanOutput('streams', dataStreams), null, 2) || '[]',
        JSON.stringify(cleanOutput('customDimensions',
          listGA4Entities(
            'customDimensions', 
            propertyResourceName).customDimensions), null, 2) || '[]',
        JSON.stringify(cleanOutput('customMetrics',
          listGA4Entities(
            'customMetrics', 
            propertyResourceName).customMetrics), null, 2) || '[]',
        JSON.stringify(cleanOutput('keyEvents',
          listGA4Entities(
            'keyEvents', 
            propertyResourceName).keyEvents), null, 2) || '[]',
        JSON.stringify(cleanOutput('googleAdsLinks',
          listGA4Entities(
            'googleAdsLinks', 
          propertyResourceName).googleAdsLinks), null, 2) || '[]',
        JSON.stringify(cleanOutput('displayVideo360AdvertiserLinks',
          listGA4Entities(
            'displayVideo360AdvertiserLinks', 
            propertyResourceName).displayVideo360AdvertiserLinks),
          null, 2) || '[]',
        JSON.stringify(cleanOutput('searchAds360Links',
          listGA4Entities(
            'searchAds360Links', 
            propertyResourceName).searchAds360Links), null, 2) || '[]',
        JSON.stringify(cleanOutput('firebaseLinks',
          listGA4Entities(
            'firebaseLinks', 
            propertyResourceName).firebaseLinks), null, 2) || '[]',
        JSON.stringify(cleanOutput('adSenseLinks',
          listGA4Entities(
            'adSenseLinks', 
            propertyResourceName).adSenseLinks), null, 2) || '[]',
        JSON.stringify(cleanOutput('channelGroups',
          listGA4Entities(
            'channelGroups', 
            propertyResourceName).channelGroups), null, 2) || '[]'
      ]);
    });
  }
  return data;
}

/**
 * Removes unnecessary fields from the various resources.
 */
function cleanOutput(resourceType, value) {
  if (value) {
    if (resourceType == 'properties') {
      delete value.updateTime;
      delete value.createTime;
      delete value.displayName;
      delete value.account;
      delete value.parent;
      delete value.serviceLevel;
      delete value.name;
      delete value.propertyType;
    } else if (resourceType == 'data retention') {
      delete value.name;
      if (/twenty|thirty|fifty/.test(value.eventDataRetention)) {
        value.evenDataRetention = 'FOURTEEN_MONTHS';
      }
    } else if (resourceType == 'attribution') {
      delete value.name;
    } else if (resourceType == 'audiences') {
      const defaultAudienceNames = ['All Users', 'Purchasers'];
      defaultAudienceNames.forEach(defaultName => {
        const index = value.findIndex(aud => aud.displayName == defaultName);
        if (index > -1) {
          value.splice(index, 1);
        }
      });
      value.forEach(audience => {
        delete audience.name;
        if (audience.description == undefined) {
          audience.description = audience.displayName;
        }
        if (!audience.eventTrigger) {
          delete audience.eventTrigger;
        }
      });
    } else if (resourceType == 'streams') {
      value.forEach(stream => {
        delete stream.name;
        delete stream.updateTime;
        delete stream.createTime;
        if (stream.eventCreateRules) {
          delete stream.eventCreateRules.name;
        }
        if (stream.measurementProtocolSecrets) {
          delete stream.measurementProtocolSecrets.name;
          delete stream.measurementProtocolSecrets.secretValue;
        }
        if (stream.webStreamData) {
          delete stream.webStreamData.measurementId;
          delete stream.webStreamData.enhancedMeasurementSettings.name;
        }
      });
    } else if (resourceType == 'customDimensions') {
      value.forEach(dimension => {
        delete dimension.name;
      });
    } else if (resourceType == 'customMetrics') {
      value.forEach(metric => {
        delete metric.name;
      });
    } else if (resourceType == 'keyEvents') {
      const defaultConversions = [
        'app_store_subscription_convert',
        'app_store_subscription_renew',
        'ecommerce_purchase',
        'first_open',
        'in_app_purchase',
        'purchase'
      ];
      defaultConversions.forEach(defaultConversion => {
        const index = value.findIndex(
          conversion => conversion.eventName == defaultConversion);
        if (index > -1) {
          value.splice(index, 1);
        }
      });
      if (value != undefined) {
        value.forEach(conversion => {
          delete conversion.name;
          delete conversion.createTime;
          delete conversion.deletable;
        });
      }
    } else if (resourceType == 'googleAdsLinks') {
      value.forEach(link => {
        delete link.name;
        delete link.canManageClients;
        delete link.createTime;
        delete link.updateTime;
        delete link.creatorEmailAddress;
      });
    } else if (resourceType == 'displayVideo360AdvertiserLinks') {
      value.forEach(link => {
        delete link.name;
        delete link.advertiserDisplayName;
      });
    } else if (resourceType == 'searchAds360Links') {
      value.forEach(link => {
        delete link.name;
        delete link.advertiserDisplayName;
      });
    } else if (resourceType == 'firebaseLinks') {
      value.forEach(link => {
        delete link.name;
        delete link.createTime;
      });
    } else if (resourceType == 'channelGroups') {
      value = value.filter(group => !group.systemDefined);
      value.forEach(group => {
        delete group.name;
        delete group.systemDefined;
      });
    }
    return value;
  }
}

/**
 * Create new property.
 */
function createPropertiesFromTemplates() {
  const data = 
    getDataFromSheet(sheetsMeta.ga4.fullPropertyDeployment.sheetName);
  if (data.length > 0) {
    const createdAccountIds = [];
    const createdPropertyIds = [];
    let hasCreatedProperty = false;

    data.forEach((row, index) => {
      const create = row[row.length - 4];
      if (create) {
        const targetAccountId = row[4] || row[1];
        const parentAccount = 'accounts/' + targetAccountId;

        // Parse settings.
        const settings = {
          property: JSON.parse(row[6] || '[]'),
          dataRetentionSettings: JSON.parse(row[7] || '[]'),
          attributionSettings: JSON.parse(row[8] || '[]'),
          audiences: row[9],
          streams: JSON.parse(row[10] || '[]'),
          customDimensions: JSON.parse(row[11] || '[]'),
          customMetrics: JSON.parse(row[12] || '[]'),
          keyEvents: JSON.parse(row[13] || '[]'),
          googleAdsLinks: JSON.parse(row[14] || '[]'),
          displayVideo360AdvertiserLinks: JSON.parse(row[15] || '[]'),
          searchAds360Links: JSON.parse(row[16] || '[]'),
          firebaseLinks: JSON.parse(row[17] || '[]'),
          adSenseLinks: JSON.parse(row[18] || '[]'),
          channelGroups: JSON.parse(row[19] || '[]'),
        };

        let newProperty = null;
        let responses = [];
        for (setting in settings) {
          originalPropertyId = row[3];
          if (setting == 'property') {
            // Create new property.
            settings.property.displayName = row[5];
            newProperty = createGA4Entity(
              'properties', parentAccount, settings.property);
            responses.push(newProperty);
            if (newProperty instanceof Error || !newProperty.name) {
              break;
            }
          } else if (setting == 'dataRetentionSettings') {
            // Set data retention settings.
            const response = updateGA4Entity(
              setting, 
              `${newProperty.name}/${setting}`, 
              settings[setting]
            );
            responses.push(response);
          } else if (setting == 'attributionSettings') {
            // Set attribution settings.
            const response = updateGA4Entity(
              setting, 
              `${newProperty.name}/${setting}`, 
              settings[setting]
            );
            responses.push(response);
          } else {
            // Create settings.
            const values = settings[setting];
            if (values.length > 0 && setting != 'audiences') {
              values.forEach(value => {
                if (value.webStreamData || 
                value.androidAppStreamData || 
                value.iosAppStreamData) {
                  const mps = value.measurementProtocolSecrets;
                  delete value.measurementProtocolSecrets;
                  const ecr = value.eventCreateRules;
                  delete value.eventCreateRules;
                  let newStream = {};
                  if (value.webStreamData) {
                    const ems = value.webStreamData.enhancedMeasurementSettings;
                    delete value.webStreamData.enhancedMeasurementSettings;
                    newStream = createGA4Entity(
                      setting, newProperty.name, value);
                    responses.push(newStream);
                    const newEnhancedMeasurementSettings = updateGA4Entity(
                      'enhancedMeasurementSettings',
                      `${newStream.name}/enhancedMeasurementSettings`,
                      JSON.parse(JSON.stringify(ems))
                    );
                    responses.push(newEnhancedMeasurementSettings);
                  }
                  if (value.androidAppStreamData || value.iosAppStreamData) {
                    newStream = createGA4Entity(
                      setting, newProperty.name, value);
                  }
                  if (mps) {
                    mps.forEach(secret => {
                      const newSecret = createGA4Entity(
                      'measurementProtocolSecrets', newStream.name, secret);
                      responses.push(newSecret);
                    });
                  }
                  if (ecr) {
                    ecr.forEach(rule => {
                      const newEventCreateRule = createGA4Entity(
                        'eventCreateRules', newStream.name, rule);
                      responses.push(newEventCreateRule);
                    });
                  }
                } else {
                  const response = createGA4Entity(
                    setting, newProperty.name, value);
                  responses.push(response);
                }
              });
            } else if (setting == 'audiences') {
              const copyAudiences = values;
              if (copyAudiences) {
                const audiences = listGA4Entities(
                  setting, `properties/${originalPropertyId}`)[setting];
                const templateValues = cleanOutput('audiences', audiences);
                templateValues.forEach(resource => {
                  const response = createGA4Entity(
                    setting, newProperty.name, 
                    JSON.parse(JSON.stringify(resource)));
                  responses.push(response);
                });
              }
            }
          }
        }
        const sheet = SpreadsheetApp.getActive().getSheetByName(
          sheetsMeta.ga4.fullPropertyDeployment.sheetName
        );
        // Set new property URL in the spreadsheet if creation was successful.
        if (newProperty && newProperty.name) {
          sheet.getRange(
              index + 2, 
              sheetsMeta.ga4.fullPropertyDeployment.read.numColumns - 4, 1, 1)
            .setFormula(
              '=HYPERLINK("https://analytics.google.com/analytics/web/#/p' + 
              newProperty.name.split('/')[1] + '", "New Property")');
        }
        // Write the actions taken.
        const actionTaken = responseCheck(responses, 'create');
        writeActionTakenToSheet(
          sheetsMeta.ga4.fullPropertyDeployment.sheetName, index, 
          actionTaken);
        if (actionTaken && !String(actionTaken).startsWith('Error')) {
          hasCreatedProperty = true;
          if (targetAccountId) {
            createdAccountIds.push(targetAccountId);
          }
          if (newProperty && newProperty.name) {
            createdPropertyIds.push(newProperty.name);
          } else if (row[3]) {
            createdPropertyIds.push(row[3]);
          }
        }
      }
    });
    if (hasCreatedProperty && typeof Telemetry !== 'undefined') {
      Telemetry.logSolutionUsage({
        accountIds: createdAccountIds,
        propertyIds: createdPropertyIds,
        label: sheetsMeta.ga4.fullPropertyDeployment.sheetName,
      });
    }
  }
}


/**
 * Writes all of property deployment templates to a spreadsheet.
 */
function writePropertyTemplatesToSheet() {
  const properties = getSelectedGa4Properties();
  const data = listAllFeatureSettings(properties);
  clearSheetContent(sheetsMeta.ga4.fullPropertyDeployment);
  if (data.length > 0) {
    writeToSheet(data, sheetsMeta.ga4.fullPropertyDeployment.sheetName);
    resizeEasyPropertyCreationSheetRowHeights();
  }
}

/**
 * Resizes the row heights for the easy property creation sheet.
 */
function resizeEasyPropertyCreationSheetRowHeights() {
  resizeRowHeights(sheetsMeta.ga4.fullPropertyDeployment.sheetName, 50);
}