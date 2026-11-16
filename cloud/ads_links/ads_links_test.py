# Copyright 2024 Google LLC
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

"""Tests for the Google Ads Links cloud function.

Tests various functions for the Google Ads Links cloud function.
"""

import base64
import json
import unittest
from absl.testing import absltest
from absl.testing import parameterized
import ads_links
from cloudevents.http import CloudEvent


class GoogleAdsLinksTest(parameterized.TestCase):

  def setUp(self):
    super(GoogleAdsLinksTest, self).setUp()
    self.attributes = {
        'source': 'test',
        'type': 'test',
    }
    self.data = {
        'client_id': '123',
        'client_secret': 'ABC',
        'refresh_token': '123ABC',
        'token_uri': 'google.com',
        'scopes': ['https://www.googleapis.com/auth/analytics.edit'],
        'enable_logging': True,
        'customer_id': '123',
        'action': 'create',
        'ads_personalization_enabled': True,
        'property_id': '1234567',
        'name': 'properties/1234567/adsLinks/abcdefg',
    }
    self.mock_tadau = self.enter_context(
        unittest.mock.patch.object(ads_links, 'Tadau')
    )

  def test_main_missing_data_raises_error(self):
    missing_data = CloudEvent(self.attributes, {'message': {}})
    error_message = 'Invalid message. Missing "data" key.'
    self.assertEqual(error_message, ads_links.main(missing_data))

  def test_main_missing_required_key_raises_errors(self):
    del self.data['client_id']
    del self.data['action']
    encoded_data = base64.b64encode(json.dumps(self.data).encode('utf-8'))
    missing_keys = CloudEvent(
        self.attributes, {'message': {'data': encoded_data}})
    error_message = 'Missing keys: client_id,action'
    self.assertEqual(error_message, ads_links.main(missing_keys))

  @unittest.mock.patch('ads_links.AnalyticsAdminServiceClient')
  def test_get_ga_client_creates_admin_client(self, mock_analytics_client):
    ads_links.get_ga_client(
        self.data['refresh_token'],
        self.data['token_uri'],
        self.data['client_id'],
        self.data['client_secret'],
        self.data['scopes'])
    mock_analytics_client.assert_called()

  @parameterized.named_parameters(
      dict(testcase_name='test_main_calls_create_google_ads_link',
           action='create',
           result='created'),
      dict(testcase_name='test_main_calls_update_google_ads_link',
           action='update',
           result='updated'),
      dict(testcase_name='test_main_calls_delete_google_ads_link',
           action='delete',
           result='deleted'),
      dict(testcase_name='test_main_calls_list_google_ads_links',
           action='list',
           result='listed'))
  @unittest.mock.patch('ads_links.get_ga_client')
  def test_main_calling_google_ads_link_methods(
      self, mock_ga_client, action, result):
    self.data['action'] = action
    encoded_data = base64.b64encode(json.dumps(self.data).encode('utf-8'))
    cloud_event = CloudEvent(
        self.attributes, {'message': {'data': encoded_data}})
    if action == 'create':
      mock_ga_client().create_google_ads_link.return_value = result
    elif action == 'update':
      mock_ga_client().update_google_ads_link.return_value = result
    elif action == 'delete':
      mock_ga_client().delete_google_ads_link.return_value = result
    elif action == 'list':
      mock_ga_client().list_google_ads_links.return_value = result
    self.assertEqual(result, ads_links.main(cloud_event))

  @unittest.mock.patch('ads_links.Tadau')
  @unittest.mock.patch('ads_links.get_ga_client')
  def test_main_emits_telemetry_and_fails_open(
      self, mock_ga_client, mock_tadau
  ):
    mock_ga_client().create_google_ads_link.return_value = 'created'
    encoded_data = base64.b64encode(json.dumps(self.data).encode('utf-8'))
    cloud_event = CloudEvent(
        self.attributes, {'message': {'data': encoded_data}}
    )
    self.assertEqual('created', ads_links.main(cloud_event))
    mock_tadau.assert_called_once_with(
        api_secret='S7toNnNZQPWzViq44q_8gg',
        measurement_id='G-Z2TKLQZ79K',
        opt_in=True,
        fixed_dimensions={
            'app': 'GA4 Toolkit',
            'is_agent_event': False,
            'non_personalized_ads': False,
        },
    )
    sent_events = mock_tadau.return_value.send_events.call_args[0][0]
    self.assertLen(sent_events, 1)
    self.assertEqual(sent_events[0]['name'], 'SOLUTION_USAGE')
    self.assertEqual(sent_events[0]['th_analytics_property_id'], '1234567')
    self.assertEqual(sent_events[0]['th_google_ads_customer_id'], '123')

    # Verify fail-open resilience when Tadau raises an exception
    mock_tadau.return_value.send_events.side_effect = RuntimeError('Network error')
    self.assertEqual('created', ads_links.main(cloud_event))


if __name__ == '__main__':
  absltest.main()
