/**
 * Copyright 2026 Google LLC
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
 * @fileoverview Fail-open Telemetry Hub client for GA4 Toolkit (Google
 * Analytics Utilities) using the Tadau GA4 Measurement Protocol endpoint.
 *
 * Emits anonymous usage telemetry to Telemetry Hub (Showcase ID: JTP-FS-001).
 * All public methods fail open silently and never throw or surface UI alerts.
 */
const Telemetry = (() => {
  const MEASUREMENT_ID_ = 'G-Z2TKLQZ79K';
  const API_SECRET_ = 'S7toNnNZQPWzViq44q_8gg';
  const COLLECT_ENDPOINT_ =
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID_}&api_secret=${API_SECRET_}`;
  const DEBUG_ENDPOINT_ =
      `https://www.google-analytics.com/debug/mp/collect?measurement_id=${MEASUREMENT_ID_}&api_secret=${API_SECRET_}`;

  // Exact case-sensitive match with app_names[0] in
  // corp/gtech/ads/infrastructure/telemetry_hub/solutions/google-analytics-utilities.gcl
  const APP_NAME_ = 'GA4 Toolkit';
  const DOC_PROP_CLIENT_ID_KEY_ = 'TH_ANON_CLIENT_ID';
  const DOC_PROP_OPT_IN_KEY_ = 'TH_OPT_IN';

  const EventType = {
    SOLUTION_USAGE: 'SOLUTION_USAGE',
    SHEETS_REPORT_GENERATED: 'SHEETS_REPORT_GENERATED',
    SLIDES_REPORT_GENERATED: 'SLIDES_REPORT_GENERATED',
  };

  /**
   * Returns whether usage telemetry collection is enabled (opt-in defaults to
   * true unless explicitly disabled in DocumentProperties).
   * @return {boolean} True if telemetry is enabled.
   */
  function isOptIn() {
    try {
      const docProps = PropertiesService.getDocumentProperties();
      if (docProps) {
        const raw = docProps.getProperty(DOC_PROP_OPT_IN_KEY_);
        if (raw !== null && raw !== undefined && raw !== '') {
          return String(raw).toLowerCase() !== 'false';
        }
      }
    } catch (e) {
      // Ignore storage access errors and default to opt-in.
    }
    return true;
  }

  /**
   * Sets whether usage telemetry collection is enabled for this spreadsheet.
   * @param {boolean} enabled True to opt in, false to opt out.
   */
  function setOptIn(enabled) {
    try {
      const docProps = PropertiesService.getDocumentProperties();
      if (docProps) {
        docProps.setProperty(DOC_PROP_OPT_IN_KEY_, enabled ? 'true' : 'false');
      }
    } catch (e) {
      // Ignore storage errors silently.
    }
  }

  /**
   * Returns an anonymous, per-spreadsheet-copy UUID persisted in
   * DocumentProperties. Never reads or transmits user email or PII.
   * @return {string} Anonymous UUID string.
   */
  function getOrCreateAnonymousClientId_() {
    try {
      const docProps = PropertiesService.getDocumentProperties();
      if (docProps) {
        let clientId = docProps.getProperty(DOC_PROP_CLIENT_ID_KEY_);
        if (!clientId) {
          clientId = Utilities.getUuid();
          docProps.setProperty(DOC_PROP_CLIENT_ID_KEY_, clientId);
        }
        return clientId;
      }
    } catch (e) {
      // Ignore storage access errors and fall back to an ephemeral UUID.
    }
    return Utilities.getUuid();
  }

  /**
   * Normalizes single or multiple GA4/Opportunity resource identifiers into a
   * deduplicated comma-separated string of bare numeric IDs (without spaces or
   * resource prefixes such as 'properties/' or 'accounts/').
   *
   * @param {string|number|!Array<string|number>|null|undefined} rawIds
   * @return {string} Comma-separated bare numeric IDs, or empty string.
   */
  function normalizeNumericIds_(rawIds) {
    if (rawIds === null || rawIds === undefined || rawIds === '') {
      return '';
    }
    const items = Array.isArray(rawIds) ? rawIds : String(rawIds).split(',');
    const seen = {};
    const cleaned = [];
    for (let i = 0; i < items.length; i++) {
      const raw = String(items[i] == null ? '' : items[i]).trim();
      if (!raw) continue;
      const bare = raw
          .replace(/^(properties|accounts)\//i, '')
          .replace(/\D+/g, '');
      if (bare && !seen[bare]) {
        seen[bare] = true;
        cleaned.push(bare);
      }
    }
    return cleaned.join(',');
  }

  /**
   * Normalizes external Google Ads Customer IDs into a deduplicated
   * comma-separated string with hyphens preserved (XXX-XXX-XXXX, e.g.,
   * '123-456-7890') as required by Telemetry Hub for external CIDs.
   *
   * @param {string|number|!Array<string|number>|null|undefined} rawIds
   * @return {string} Comma-separated formatted Customer IDs, or empty string.
   */
  function normalizeExternalAdsCustomerIds_(rawIds) {
    if (rawIds === null || rawIds === undefined || rawIds === '') {
      return '';
    }
    const items = Array.isArray(rawIds) ? rawIds : String(rawIds).split(',');
    const seen = {};
    const cleaned = [];
    for (let i = 0; i < items.length; i++) {
      const raw = String(items[i] == null ? '' : items[i]).trim();
      if (!raw) continue;
      const digits = raw.replace(/\D+/g, '');
      if (!digits) continue;
      const formatted = digits.length === 10 ?
          `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` :
          digits;
      if (!seen[formatted]) {
        seen[formatted] = true;
        cleaned.push(formatted);
      }
    }
    return cleaned.join(',');
  }

  /**
   * Builds the GA4 Measurement Protocol payload expected by Telemetry Hub's
   * Tadau ingestion pipeline (tadau_extract.sql & tadau_import.sql).
   *
   * @param {string} eventName Telemetry Hub Event.Type name.
   * @param {!Object=} options Account/property IDs and optional label.
   * @return {?Object} Payload object, or null if no product account ID is
   *     present (tadau_extract.sql requires at least one th_* parameter).
   */
  function buildPayload_(eventName, options) {
    const opts = options || {};
    const clientId = getOrCreateAnonymousClientId_();
    const propertyIds = normalizeNumericIds_(
        opts.propertyIds || opts.propertyId || opts.th_analytics_property_id);
    const accountIds = normalizeNumericIds_(
        opts.accountIds || opts.accountId || opts.th_analytics_account_id);
    const googleAdsCustomerIds = normalizeExternalAdsCustomerIds_(
        opts.googleAdsCustomerIds || opts.googleAdsCustomerId ||
        opts.th_google_ads_customer_id);
    const opportunityIds = normalizeNumericIds_(
        opts.opportunityIds || opts.opportunityId || opts.th_opportunity_id);

    if (!propertyIds && !accountIds && !googleAdsCustomerIds &&
        !opportunityIds) {
      return null;
    }

    const eventParams = {
      app: APP_NAME_,
      is_agent_event: false,
      non_personalized_ads: false,
      user_id: clientId,
      external_event_id: Utilities.getUuid(),
    };

    if (propertyIds) {
      eventParams.th_analytics_property_id = propertyIds;
    }
    if (accountIds) {
      eventParams.th_analytics_account_id = accountIds;
    }
    if (googleAdsCustomerIds) {
      eventParams.th_google_ads_customer_id = googleAdsCustomerIds;
    }
    if (opportunityIds) {
      eventParams.th_opportunity_id = opportunityIds;
    }
    if (opts.label) {
      eventParams.label = String(opts.label).slice(0, 100);
    }

    return {
      client_id: clientId,
      user_id: clientId,
      non_personalized_ads: false,
      events: [
        {
          name: eventName,
          params: eventParams,
        },
      ],
    };
  }

  /**
   * Sends a telemetry event to the GA4 Measurement Protocol endpoint.
   * Wrapped in try/catch to fail open silently.
   *
   * @param {string} eventName Event type ('SOLUTION_USAGE',
   *     'SHEETS_REPORT_GENERATED', or 'SLIDES_REPORT_GENERATED').
   * @param {!Object=} options Identifiers ({propertyIds, accountIds,
   *     googleAdsCustomerIds, opportunityIds, label}).
   * @param {boolean=} useDebugEndpoint True to call /debug/mp/collect.
   * @return {?GoogleAppsScript.URL_Fetch.HTTPResponse} Response or null.
   */
  function sendEvent_(eventName, options, useDebugEndpoint) {
    try {
      const opts = options || {};
      if (opts.optIn === false || !isOptIn()) {
        return null;
      }
      const payload = buildPayload_(eventName, opts);
      if (!payload) {
        return null;
      }
      const endpoint = useDebugEndpoint ? DEBUG_ENDPOINT_ : COLLECT_ENDPOINT_;
      return UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
    } catch (e) {
      // Fail-open silently: never block user operations or show UI alerts.
      console.warn('Telemetry dispatch skipped:', e);
      return null;
    }
  }

  function logSolutionUsage(options) {
    sendEvent_(EventType.SOLUTION_USAGE, options, false);
  }

  function logSheetsReportGenerated(options) {
    sendEvent_(EventType.SHEETS_REPORT_GENERATED, options, false);
  }

  function logSlidesReportGenerated(options) {
    sendEvent_(EventType.SLIDES_REPORT_GENERATED, options, false);
  }

  return {
    EventType: EventType,
    isOptIn: isOptIn,
    setOptIn: setOptIn,
    logSolutionUsage: logSolutionUsage,
    logSheetsReportGenerated: logSheetsReportGenerated,
    logSlidesReportGenerated: logSlidesReportGenerated,
    normalizeNumericIds_: normalizeNumericIds_,
    normalizeExternalAdsCustomerIds_: normalizeExternalAdsCustomerIds_,
    buildPayload_: buildPayload_,
    sendDebugEvent_: (eventName, options) =>
        sendEvent_(eventName, options, true),
  };
})();

/**
 * Validation test harness for Apps Script editor execution.
 * Calls /debug/mp/collect and logs validationMessages.
 */
function testTelemetry_() {
  const testOptions = {
    propertyIds: ['properties/123456789', '987654321', 'properties/123456789'],
    accountIds: 'accounts/555666777',
    googleAdsCustomerIds: ['1234567890', '123-456-7890'],
    opportunityIds: '888999000',
    label: 'unit_test_validation',
  };

  const payload = Telemetry.buildPayload_(
      Telemetry.EventType.SOLUTION_USAGE, testOptions);
  console.log('Generated Tadau MP Payload:', JSON.stringify(payload, null, 2));

  const response = Telemetry.sendDebugEvent_(
      Telemetry.EventType.SOLUTION_USAGE, testOptions);
  if (!response) {
    console.error('Telemetry debug request did not return a response.');
    return;
  }

  console.log(`HTTP Status: ${response.getResponseCode()}`);
  console.log(`Debug Response Body: ${response.getContentText()}`);
}
