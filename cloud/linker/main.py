# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import functions_framework
import os
import io
import re
import time
import uuid
import pandas
import google.oauth2.credentials
from google.analytics.admin import AnalyticsAdminServiceClient
from google.analytics.admin_v1alpha.types import GoogleAdsLink
from google.analytics.admin_v1alpha.types import DisplayVideo360AdvertiserLink
from google.analytics.admin_v1alpha.types import DisplayVideo360AdvertiserLinkProposal
from google.cloud import storage

try:
    from tadau import Tadau
except ImportError:
    Tadau = None

_TELEMETRY_MEASUREMENT_ID = 'G-Z2TKLQZ79K'
_TELEMETRY_API_SECRET = 'S7toNnNZQPWzViq44q_8gg'
_TELEMETRY_APP_NAME = 'GA4 Toolkit'

storage_client = storage.Client()

OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET')
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
ACCESS_TOKEN = os.environ.get('ACCESS_TOKEN')
REFRESH_TOKEN = os.environ.get('REFRESH_TOKEN')
TOKEN_URI = os.environ.get('TOKEN_URI')
REQUEST_DELAY = .2


@functions_framework.cloud_event
def main(cloud_event):
    start_time = time.time()
    data = cloud_event.data
    ga_client = get_ga_client()
    bucket = data['bucket']
    name = data['name']
    file_name = 'gs://' + bucket + '/' + name
    df = pandas.read_csv(file_name, on_bad_lines='skip')
    records = df.to_dict('records')
    print(records)
    responses = []
    for index, row in enumerate(records):
        if time.time() - start_time < 348000000:
            if row['request_type'] == 'ads':
                try:
                    customer_id = str(row['ads_customer_id'])
                    parent = f"properties/{row['ga4_property_id']}"
                    response = ga_client.create_google_ads_link(
                        parent=parent,
                        google_ads_link=GoogleAdsLink(
                            customer_id=customer_id,
                            ads_personalization_enabled=row['ads_personalization_enabled']))
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': customer_id,
                        'type': 'ads',
                        'link_resource_name': response.name,
                        'result': 'created'})
                except Exception as e:
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': customer_id,
                        'type': 'ads',
                        'link_resource_name': 'n/a',
                        'result': e})
                time.sleep(REQUEST_DELAY)
            if row['request_type'] == 'dv360':
                try:
                    advertiser_id = str(row['dv360_advertiser_id'])
                    parent = f"properties/{row['ga4_property_id']}"
                    dv360_link = DisplayVideo360AdvertiserLink(
                        advertiser_id=advertiser_id,
                        ads_personalization_enabled = row['ads_personalization_enabled'],
                        campaign_data_sharing_enabled = row['dv360_campaign_data_sharing_enabled'],
                        cost_data_sharing_enabled = row['dv360_cost_data_sharing_enabled'])
                    response = ga_client.create_display_video360_advertiser_link(
                        parent=parent,
                        display_video360_advertiser_link=dv360_link)
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': advertiser_id,
                        'type': 'dv360',
                        'link_resource_name': response.name,
                        'result': 'created'})
                except Exception as e:
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': advertiers_id,
                        'type': 'dv360',
                        'link_resource_name': 'n/a',
                        'result': e})
                time.sleep(REQUEST_DELAY)
            if row['request_type'] == 'dv360_link_proposal':
                try:
                    advertiser_id = str(row['dv360_advertiser_id'])
                    parent = f"properties/{row['ga4_property_id']}"
                    dv360_link_proposal = DisplayVideo360AdvertiserLinkProposal(
                        advertiser_id=advertiser_id,
                        ads_personalization_enabled = row['ads_personalization_enabled'],
                        campaign_data_sharing_enabled = row['dv360_campaign_data_sharing_enabled'],
                        cost_data_sharing_enabled = row['dv360_cost_data_sharing_enabled'],
                        validation_email = row['dv360_proposal_validation_email'])
                    response = ga_client.create_display_video360_advertiser_link(
                        parent=parent,
                        display_video360_advertiser_link_proposal=dv360_link_proposal)
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': advertiser_id,
                        'type': 'dv360 link proposal',
                        'link_resource_name': response.name,
                        'result': 'created'})
                except Exception as e:
                    responses.append({
                        'ga_propety_id': row['ga4_property_id'],
                        'platform_id': advertiers_id,
                        'type': 'dv360 link proposal',
                        'link_resource_name': 'n/a',
                        'result': e})
                time.sleep(REQUEST_DELAY)
        else:
            current_row = index + 1
            remaining = df.iloc[current_row:,:]
            remaining_csv = pandas.DataFrame(remaining).to_csv()
            remaining_blob = storage_client.get_bucket(bucket).blob(f'remaining-{time.time()}.csv')
            remaining_blob.upload_from_string(remaining_csv, content_type='text/csv')
            break;
    csv_str = pandas.DataFrame(responses).to_csv()
    output_bucket_blob = storage_client.get_bucket(OUTPUT_BUCKET).blob(f'results-{time.time()}.csv')
    output_bucket_blob.upload_from_string(csv_str, content_type='text/csv')
    _log_batch_telemetry(responses)


def _normalize_numeric_ids(raw_values):
    seen = set()
    cleaned = []
    for val in raw_values:
        if val is None:
            continue
        bare = re.sub(r'\D+', '', str(val))
        if bare and bare not in seen:
            seen.add(bare)
            cleaned.append(bare)
    return ','.join(cleaned)


def _format_external_ads_customer_ids(raw_values):
    seen = set()
    cleaned = []
    for val in raw_values:
        if val is None:
            continue
        digits = re.sub(r'\D+', '', str(val))
        if not digits:
            continue
        formatted = (
            f'{digits[:3]}-{digits[3:6]}-{digits[6:]}'
            if len(digits) == 10
            else digits
        )
        if formatted not in seen:
            seen.add(formatted)
            cleaned.append(formatted)
    return ','.join(cleaned)


def _log_batch_telemetry(responses):
    """Fails open to emit a SOLUTION_USAGE event via Tadau for created links."""
    try:
        if Tadau is None or not responses:
            return
        opt_in = os.environ.get('TELEMETRY_OPT_IN', 'true').strip().lower() not in (
            'false',
            '0',
            'no',
        )
        if not opt_in:
            return
        created = [r for r in responses if r.get('result') == 'created']
        if not created:
            return
        prop_ids = _normalize_numeric_ids([r.get('ga_propety_id') for r in created])
        ads_cids = _format_external_ads_customer_ids([
            r.get('platform_id') for r in created if r.get('type') == 'ads'
        ])
        if not prop_ids and not ads_cids:
            return
        event = {
            'name': 'SOLUTION_USAGE',
            'external_event_id': str(uuid.uuid4()),
            'label': 'cloud_linker_batch',
        }
        if prop_ids:
            event['th_analytics_property_id'] = prop_ids
        if ads_cids:
            event['th_google_ads_customer_id'] = ads_cids
        tadau_client = Tadau(
            api_secret=_TELEMETRY_API_SECRET,
            measurement_id=_TELEMETRY_MEASUREMENT_ID,
            opt_in=opt_in,
            fixed_dimensions={
                'app': _TELEMETRY_APP_NAME,
                'is_agent_event': False,
                'non_personalized_ads': False,
            },
        )
        tadau_client.send_events([event])
    except Exception:
        pass



def get_ga_client():
    credentials = google.oauth2.credentials.Credentials(
        ACCESS_TOKEN,
        refresh_token=REFRESH_TOKEN,
        token_uri=TOKEN_URI,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET)
    return AnalyticsAdminServiceClient(credentials=credentials)
