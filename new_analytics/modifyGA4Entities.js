/**
 * Copyright 2024 Google LLC
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
 * Modifies GA4 custom dimensions.
 */
function modifyGA4CustomDimensions() {
  modifyGA4Entities(sheetsMeta.ga4.customDimensions.sheetName);
}

/**
 * Modifies GA4 custom metrics.
 */
function modifyGA4CustomMetrics() {
  modifyGA4Entities(sheetsMeta.ga4.customMetrics.sheetName);
}

/**
 * Modifies GA4 key events.
 */
function modifyGA4KeyEvents() {
  modifyGA4Entities(sheetsMeta.ga4.keyEvents.sheetName);
}

/**
 * Modifies GA4 Google Ads Links.
 */
function modifyGA4AdsLinks() {
  modifyGA4Entities(sheetsMeta.ga4.googleAdsLinks.sheetName);
}

/**
 * Modifies GA4 Firebase links.
 */
function modifyGA4FirebaseLinks() {
  modifyGA4Entities(sheetsMeta.ga4.firebaseLinks.sheetName);
}

/**
 * Modifies GA4 DV360 links.
 */
function modifyGA4DV360Links() {
  modifyGA4Entities(sheetsMeta.ga4.displayVideo360AdvertiserLinks.sheetName);
}

/**
 * Modifies GA4 properties.
 */
function modifyGA4Properties() {
  modifyGA4Entities(sheetsMeta.ga4.properties.sheetName);
}

/**
 * Modifies GA4 streams.
 */
function modifyGA4Streams() {
  modifyGA4Entities(sheetsMeta.ga4.streams.sheetName);
}

/**
 * Modifies GA4 audiences.
 */
function modifyGA4Audiences() {
  modifyGA4Entities(sheetsMeta.ga4.audiences.sheetName);
}

/**
 * Modifies GA4 user links.
 */
function modifyGA4AccessBindings() {
  modifyGA4Entities(sheetsMeta.ga4.accessBindings.sheetName);
}

/**
 * Modifies GA4 SA360 links.
 */
function modifyGA4SA360Links() {
  modifyGA4Entities(sheetsMeta.ga4.sa360Links.sheetName);
}

/**
 * Modifies GA4 Expanded Data Sets.
 */
function modifyGA4ExpandedDataSets() {
  modifyGA4Entities(sheetsMeta.ga4.expandedDataSets.sheetName);
}

/**
 * Modifies connected site tags.
 */
function modifyConnectedSiteTags() {
  modifyGA4Entities(sheetsMeta.ga4.connectedSiteTags.sheetName);
}

/**
 * Modifies channel groups.
 */
function modifyChannelGroups() {
  modifyGA4Entities(sheetsMeta.ga4.channelGroups.sheetName);
}

/**
 * Modifies channel groups.
 */
function modifyMeasurementProtocolSecrets() {
  modifyGA4Entities(sheetsMeta.ga4.measurementProtocolSecrets.sheetName);
}

/**
 * Modifies AdSense links.
 */
function modifyAdSenseLinks() {
  modifyGA4Entities(sheetsMeta.ga4.adSenseLinks.sheetName);
}

/**
 * Modifies event create rules.
 */
function modifyEventCreateRules() {
  modifyGA4Entities(sheetsMeta.ga4.eventCreateRules.sheetName);
}

/**
 * Modifies event edit rules.
 */
function modifyEventEditRules() {
  modifyGA4Entities(sheetsMeta.ga4.eventEditRules.sheetName);
}

/**
 * Modifies subproperty event filters.
 */
function modifySubpropertyEventFilters() {
  modifyGA4Entities(sheetsMeta.ga4.subpropertyEventFilters.sheetName);
}

/**
 * Modifies calculated metrics.
 */
function modifyCalculatedMetrics() {
  modifyGA4Entities(sheetsMeta.ga4.subpropertyEventFilters.sheetName);
}

/**
 * Modifies rollup property source links.
 */
function modifyRollupPropertySourceLinks() {
  modifyGA4Entities(sheetsMeta.ga4.rollupPropertySourceLinks.sheetName);
}

/**
 * Modifies BigQuery links.
 */
function modifyBigQueryLinks() {
  modifyGA4Entities(sheetsMeta.ga4.bigqueryLinks.sheetName);
}

/**
 * Loops through the rows on the sheet with data and checks either
 * skips, updates, removes, or creates an entity depending on what
 * was checked in a given sheet.
 * @param {string} sheetName The name of the sheet from which
 * the data will be retrieved.
 */
function modifyGA4Entities(sheetName) {
  let entities = getDataFromSheet(sheetName);
  let ga4Resource = Object.keys(sheetsMeta.ga4).find(
    key => sheetsMeta.ga4[key].sheetName === sheetName);
  if (entities.length > 0) {
    entities.forEach((entity, index) => {
      const responses = [];
      const remove = entity[entity.length - 4];
      const create = entity[entity.length - 3];
      const update = entity[entity.length - 2];
      let actionTaken = null;

      // Data consistent across GA4 sheets.
      let parent = '';
      let resourceName = '';
      if (sheetName == sheetsMeta.ga4.properties.sheetName) {
        parent = 'accounts/' + entity[1]
        resourceName = 'properties/' + entity[3];
      } else if (
      sheetName == sheetsMeta.ga4.measurementProtocolSecrets.sheetName) {
        parent = `properties/${entity[3]}/dataStreams/${entity[5]}`;
        resourceName = entity[7];
      } else if (sheetName == sheetsMeta.ga4.adSenseLinks.sheetName) {
        parent = `properties/${entity[3]}/dataStreams/${entity[5]}`;
        resourceName = entity[7];
      } else if (sheetName == sheetsMeta.ga4.eventCreateRules.sheetName) {
        parent = `properties/${entity[3]}/dataStreams/${entity[5]}`;
        resourceName = entity[7];
      } else if (sheetName == sheetsMeta.ga4.eventEditRules.sheetName) {
        parent = `properties/${entity[3]}/dataStreams/${entity[5]}`;
        resourceName = entity[7];
      } else {
        parent = 'properties/' + entity[3];
        resourceName = entity[5];
      }
      if (sheetName == sheetsMeta.ga4.accessBindings.sheetName &&
        entity[3] == '') {
        parent = 'accounts/' + entity[1]
        ga4Resource = 'accountAccessBindings';
      } else if (sheetName == sheetsMeta.ga4.accessBindings.sheetName &&
        entity[3] != '') {
        ga4Resource = 'propertyAccessBindings';
        parent = 'properties/' + entity[3];
      }
      // An entity cannot be both created and archived/deleted, so if both
      // are true, then the response is null and row is marked as skipped.
      if ((remove && create) || (remove && update) || (update && create)) {
        actionTaken = apiActionTaken.ga4.skipped;
        // Writes that the entity was skipped to the sheet.
        writeActionTakenToSheet(sheetName, index, actionTaken);

      // Archives custom definitions and audiences. Deletes anything else that
      // can be deleted.
      } else if (remove) {
        if (sheetName == sheetsMeta.ga4.customDimensions.sheetName ||
            sheetName == sheetsMeta.ga4.customMetrics.sheetName ||
            sheetName == sheetsMeta.ga4.audiences.sheetName) {
          responses.push(archiveGA4CustomDefinition(ga4Resource, resourceName));
          actionTaken = responseCheck(responses, 'archive');
        } else {
          if (sheetName == sheetsMeta.ga4.connectedSiteTags.sheetName) {
            resourceName = {
              property: 'properties/' + entity[4],
              tagId: entity[6].toString()
            }
            responses.push(deleteGA4Entity(ga4Resource, resourceName))
          } else {
            responses.push(deleteGA4Entity(ga4Resource, resourceName));
          }
          actionTaken = responseCheck(responses, 'delete');
        }
        // Writes that the entity was deleted or archived to the sheet.
        writeActionTakenToSheet(sheetName, index, actionTaken);

      // Creates the new entity.
      } else if (create) {
        const payload = buildCreatePayload(sheetName, entity);
        if (ga4Resource == 'properties') {
          let createResponse = '';
          if (entity[4] == 'PROPERTY_TYPE_SUBPROPERTY') {
            const subpropertyEventFilter = JSON.parse(entity[7]);
            delete subpropertyEventFilter.name;
            payload.propertyType = entity[4];
            const subpropertySettings = {
              parent: entity[5],
              subproperty: payload,
              subpropertyEventFilter: subpropertyEventFilter
            };
            createResponse = createGA4Entity('subproperties', '', subpropertySettings).subproperty;
            responses.push(createResponse);
          } else if (entity[4] == 'PROPERTY_TYPE_ROLLUP') {
            const rollupSettings = {
              rollupProperty: payload,
              sourceProperties: entity[6].split(',').map(id => id.trim())
            };
            createResponse = createGA4Entity('rollupProperties', '', rollupSettings);
            responses.push(createResponse);
          } else {
            createResponse = createGA4Entity(ga4Resource, parent, payload).rollupProperty;
            responses.push(createResponse);
          }
          if (entity[16] != 'TWO_MONTHS' || entity[17] != false) {
            responses.push(
              updateDataRetentionSettings(entity[16], entity[17],
                createResponse.name + '/dataRetentionSettings'));
          }

        } else if (ga4Resource == 'streams' && payload.webStreamData) {
          responses.push(createGA4Entity(ga4Resource, parent, payload));
          responses.push(updateEnhancedMeasurementSettings(
            buildEnhancedMeasurementSettingsPayload(entity),
            `${entity[5]}/enhancedMeasurementSettings`));
        } else {
          const createResponse = createGA4Entity(ga4Resource, parent, payload);
          responses.push(createResponse);
        }
        actionTaken = responseCheck(responses, 'create');
        writeActionTakenToSheet(sheetName, index, actionTaken);

      // Updates entities.
      } else if (update) {
        const payload = buildUpdatePayload(sheetName, entity);
        responses.push(
          updateGA4Entity(ga4Resource, resourceName, payload, index));
        if (ga4Resource == 'properties') {
          responses.push(
            updateDataRetentionSettings(entity[16], entity[17],
            resourceName + '/dataRetentionSettings'));
        } else if (ga4Resource == 'streams' && payload.webStreamData) {
          responses.push(updateEnhancedMeasurementSettings(
            buildEnhancedMeasurementSettingsPayload(entity),
            `${entity[5]}/enhancedMeasurementSettings`));
        }
        actionTaken = responseCheck(responses, 'update');
        writeActionTakenToSheet(sheetName, index, actionTaken);
      }
    });
  }
}

/**
 * Builds the payload sent to the API to create an entity.
 * @param {string} sheetName The name of the sheet from which
 * the data will be retrieved.
 * @param {!Array<!Array>} entity  A two dimensional array where each
 * inner array contains metadata about a given entity.
 */
function buildCreatePayload(sheetName, entity) {
  const payload = {};
  const entityDisplayNameOrId = entity[4];
  if (sheetName == sheetsMeta.ga4.customDimensions.sheetName ||
  sheetName == sheetsMeta.ga4.customMetrics.sheetName) {
    // Add custom dimension or metric fields.
    const parameterName = entity[6];
    const scope = entity[7];
    const description = entity[9];
    payload.displayName = entityDisplayNameOrId;
    payload.scope = scope;
    payload.description = description;
    payload.parameterName = parameterName;
    if (sheetName == sheetsMeta.ga4.customDimensions.sheetName) {
      // Add custom dimension fields.
      const disallowAdsPersonalization = entity[8];
      payload.disallowAdsPersonalization = disallowAdsPersonalization || false;
    } else if (sheetName == sheetsMeta.ga4.customMetrics.sheetName) {
      // Add custom metric fields.
      const measurementUnit = entity[8];
      if (measurementUnit == 'CURRENCY') {
        payload.restrictedMetricType = entity[10].split(', ') || [];
      }
      payload.measurementUnit = measurementUnit;
    }
  } else if (sheetName == sheetsMeta.ga4.keyEvents.sheetName) {
    // Add key event fields.
    payload.eventName = entityDisplayNameOrId;
  } else if (sheetName == sheetsMeta.ga4.googleAdsLinks.sheetName) {
    // Add Google Ads link fields.
    const adsPersonalizationEnabled = entity[7];
    payload.customerId = entityDisplayNameOrId;
    payload.adsPersonalizationEnabled = adsPersonalizationEnabled;
  } else if (sheetName == sheetsMeta.ga4.firebaseLinks.sheetName) {
    // Add Firebase link fields.
    const maximumUserAccess = entity[7];
    payload.project = entityDisplayNameOrId;
    payload.maximumUserAccess = maximumUserAccess;
  } else if (sheetName == sheetsMeta.ga4.displayVideo360AdvertiserLinks.sheetName) {
    // Add DV360 link fields.
    payload.advertiserId = entityDisplayNameOrId;
    payload.adsPersonalizationEnabled = entity[7];
    payload.campaignDataSharingEnabled = entity[8];
    payload.costDataSharingEnabled = entity[9];
  } else if (sheetName == sheetsMeta.ga4.properties.sheetName) {
    // Add fields to modify a property.
    payload.displayName = entity[2];
    payload.industryCategory = entity[10];
    payload.timeZone = entity[11];
    payload.currencyCode = entity[12];
  } else if (sheetName == sheetsMeta.ga4.streams.sheetName) {
    payload.displayName = entity[4];
    payload.type = entity[6];
    if (payload.type == 'WEB_DATA_STREAM') {
      payload.webStreamData = {
        defaultUri: entity[13]
      }
    } else if (payload.type == 'ANDROID_APP_DATA_STREAM') {
      payload.androidAppStreamData = {
        packageName: entity[8]
      }
    } else if (payload.type == 'IOS_APP_DATA_STREAM') {
      payload.iosAppStreamData = {
        bundleId: entity[9]
      }
    }
  } else if (sheetName == sheetsMeta.ga4.audiences.sheetName) {
    payload.displayName = entityDisplayNameOrId;
    payload.description = entity[6];
    payload.membershipDurationDays = entity[7];
    if (entity[9] != '') {
      payload.eventTrigger = {
        eventName: entity[9],
        logCondition: entity[10]
      };
    }
    if (entity[11] != '') {
      payload.exclusionDurationMode = entity[11];
    }
    if (entity[12].length > 0) {
      payload.filterClauses = [JSON.parse(entity[12])];
    } else {
      payload.filterClauses = [];
    }
  } else if (sheetName == sheetsMeta.ga4.accessBindings.sheetName) {
    // Build access binding payload.
    delete payload.displayName;
    delete payload.description;
    let roles = entity[7].trim();
    if ((entity[8].trim()).length > 0) {
      roles += ', ' + entity[8].trim();
    }
    payload.user = entity[4].trim();
    payload.roles = roles.split(', ');;
  } else if (sheetName == sheetsMeta.ga4.sa360Links.sheetName) {
    // Build SA360 payload.
    payload.advertiserId = entityDisplayNameOrId.trim();
    payload.adsPersonalizationEnabled = entity[7];
    payload.campaignDataSharingEnabled = entity[8];
    payload.costDataSharingEnabled = entity[9];
    payload.siteStatsSharingEnabled = entity[10];
  } else if (sheetName == sheetsMeta.ga4.expandedDataSets.sheetName) {
    // Build expanded data set payload.
    payload.displayName = entityDisplayNameOrId;
    payload.description = entity[6];
    payload.dimensionNames = entity[7].split(',').map(dim => dim.trim());
    payload.metricNames = entity[8].split(',').map(metric => metric.trim());
    if (entity[9].length > 0) {
      payload.dimensionFilterExpression = JSON.parse(entity[9]);
    }
  } else if (sheetName == sheetsMeta.ga4.connectedSiteTags.sheetName) {
    payload.property = 'properties/' + entity[4];
    payload.connectedSiteTag = {
      displayName: entity[5],
      tagId: entity[6]
    };
  } else if (sheetName == sheetsMeta.ga4.channelGroups.sheetName) {
    payload.displayName = entityDisplayNameOrId;
    payload.description = entity[6];
    payload.primary = entity[8]
    payload.groupingRule = JSON.parse(entity[9]);
  } else if (sheetName == sheetsMeta.ga4.measurementProtocolSecrets.sheetName) {
    payload.displayName = entity[6];
  } else if (sheetName == sheetsMeta.ga4.adSenseLinks.sheetName) {
    payload.adClientCode = entityDisplayNameOrId;
  } else if (sheetName == sheetsMeta.ga4.eventCreateRules.sheetName) {
    payload.destinationEvent = entity[6];
    payload.eventConditions = JSON.parse(entity[9] || '[]');
    payload.parameterMutations = JSON.parse(entity[10] || '[]');
  } else if (sheetName == sheetsMeta.ga4.eventEditRules.sheetName) {
    payload.displayName = entity[6];
    payload.eventConditions = JSON.parse(entity[9] || '[]');
    payload.parameterMutations = JSON.parse(entity[10] || '[]');
  } else if (sheetName == sheetsMeta.ga4.subpropertyEventFilters.sheetName) {
    payload.applyToProperty = entity[4];
    payload.filterClauses = entity[6];
  } else if (sheetName == sheetsMeta.ga4.rollupPropertySourceLinks.sheetName) {
    payload.sourceProperty = entity[4];
  } else if (sheetName == sheetsMeta.ga4.bigqueryLinks.sheetName) {
    payload.project = entity[4];
    payload.dailyExportEnabled = entity[7];
    payload.excludedEvents = entity[8].split(',');
    payload.exportStreams = entity[9].split(',');
    payload.includeAdvertisingId = entity[10];
    payload.streamingExportEnabled = entity[11];
    payload.freshDailyExportEnabled = entity[12];
    payload.datasetLocation = entity[13];
  }
  return payload;
}

/**
 * Builds the payload sent to the API to update an entity.
 * @param {string} sheetName The name of the sheet from which
 * the data will be retrieved.
 * @param {!Array<!Array>} entity  A two dimensional array where each
 * inner array contains metadata about a given entity.
 */
function buildUpdatePayload(sheetName, entity) {
  const payload = {};
  const entityDisplayNameOrId = entity[4];
  if (sheetName == sheetsMeta.ga4.customDimensions.sheetName ||
  sheetName == sheetsMeta.ga4.customMetrics.sheetName) {
    // Add custom dimension or metric fields.
    const description = entity[9];
    payload.displayName = entityDisplayNameOrId;
    payload.description = description;
    if (sheetName == sheetsMeta.ga4.customDimensions.sheetName) {
      // Add custom dimension fields.
      const disallowAdsPersonalization = entity[8];
      payload.disallowAdsPersonalization = disallowAdsPersonalization || false;
    } else if (sheetName == sheetsMeta.ga4.customMetrics.sheetName) {
      // Add custom metric fields.
      const measurementUnit = entity[8];
      if (measurementUnit == 'CURRENCY') {
        payload.restrictedMetricType = entity[10].split(', ') || [];
      }
      payload.measurementUnit = measurementUnit;
    }
  } else if (sheetName == sheetsMeta.ga4.googleAdsLinks.sheetName) {
    // Add Google Ads link fields.
    const adsPersonalizationEnabled = entity[7];
    payload.adsPersonalizationEnabled = adsPersonalizationEnabled;
  } else if (sheetName == sheetsMeta.ga4.displayVideo360AdvertiserLinks.sheetName) {
    // Add DV360 link fields.
    payload.adsPersonalizationEnabled = entity[7];
  } else if (sheetName == sheetsMeta.ga4.properties.sheetName) {
    // Add fields to modify a property.
    payload.displayName = entity[2];
    payload.industryCategory = entity[10];
    payload.timeZone = entity[11];
    payload.currencyCode = entity[12]
  } else if (sheetName == sheetsMeta.ga4.streams.sheetName) {
    payload.displayName = entity[4];
    if (entity[6] == 'WEB_DATA_STREAM') {
      payload.webStreamData = {
        defaultUri: entity[13]
      }
    } else if (entity[6] == 'ANDROID_APP_DATA_STREAM') {
      payload.androidAppStreamData = {
        packageName: entity[8]
      }
    } else if (entity[6] == 'IOS_APP_DATA_STREAM') {
      payload.iosAppStreamData = {
        bundleId: entity[9]
      }
    }
  } else if (sheetName == sheetsMeta.ga4.audiences.sheetName) {
    payload.displayName = entityDisplayNameOrId;
    payload.description = entity[6];
    /*
    if (entity[9] != '') {
      payload.eventTrigger = {
        eventName: entity[9],
        logCondition: entity[10]
      };
    }
    */
  } else if (sheetName == sheetsMeta.ga4.accessBindings.sheetName) {
    // Update access binding.
    delete payload.displayName;
    delete payload.description;
    let roles = entity[7].trim();
    if ((entity[8].trim()).length > 0) {
      roles += ', ' + entity[8].trim();
    }
    payload.roles = roles.split(', ');
  } else if (sheetName == sheetsMeta.ga4.sa360Links.sheetName) {
    // Update SA360 link.
    payload.adsPersonalizationEnabled = entity[7];
    payload.siteStatsSharingEnabled = entity[10];
  } else if (sheetName == sheetsMeta.ga4.expandedDataSets.sheetName) {
    // Update expanded data set.
    payload.displayName = entityDisplayNameOrId;
    payload.description = entity[6];
  } else if (sheetName == sheetsMeta.ga4.channelGroups.sheetName) {
    if (entity[7]) {
      payload.displayName = entityDisplayNameOrId;
      payload.primary = entity[8];
    } else {
      payload.displayName = entityDisplayNameOrId;
      payload.description = entity[6];
      payload.primary = entity[8];
      payload.groupingRule = JSON.parse(entity[9]);
    }
  } else if (sheetName == sheetsMeta.ga4.measurementProtocolSecrets.sheetName) {
    payload.displayName = entity[6];
  } else if (sheetName == sheetsMeta.ga4.eventCreateRules.sheetName) {
    payload.destinationEvent = entity[6];
    payload.sourceCopyParameters = entity[8];
    payload.eventConditions = JSON.parse(entity[9] || '[]');
    payload.parameterMutations = JSON.parse(entity[10] || '[]');
  } else if (sheetName == sheetsMeta.ga4.eventEditRules.sheetName) {
    payload.displayName = entity[6];
    payload.eventConditions = JSON.parse(entity[9] || '[]');
    payload.parameterMutations = JSON.parse(entity[10] || '[]');
  } else if (sheetName == sheetsMeta.ga4.subpropertyEventFilters.sheetName) {
    payload.filterClauses = entity[6];
  } else if (sheetName == sheetsMeta.ga4.bigqueryLinks.sheetName) {
    payload.dailyExportEnabled = entity[7];
    payload.excludedEvents = entity[8].split(',');
    payload.exportStreams = entity[9].split(',');
    payload.includeAdvertisingId = entity[10];
    payload.streamingExportEnabled = entity[11];
    payload.freshDailyExportEnabled = entity[12];
  }
  return payload;
}

/**
 * Builds the enhanced measurement settings payload object.
 * @param {!Array<boolean|string} sheetsRow An array of the settings from a row in the sheet.
 * @return {!Object} An object containing the enhanced measurement settings payload.
 */
function buildEnhancedMeasurementSettingsPayload(sheetsRow) {
  return {
    'streamEnabled': sheetsRow[14] || false,
    'scrollsEnabled': sheetsRow[15] || false,
    'outboundClicksEnabled': sheetsRow[16] || false,
    'siteSearchEnabled': sheetsRow[17] || false,
    'videoEngagementEnabled': sheetsRow[18] || false,
    'fileDownloadsEnabled': sheetsRow[19] || false,
    'pageChangesEnabled': sheetsRow[20] || false,
    'formInteractionsEnabled': sheetsRow[21] || false,
    'searchQueryParameter': sheetsRow[22],
    'uriQueryParameter': sheetsRow[23]
  };
}
