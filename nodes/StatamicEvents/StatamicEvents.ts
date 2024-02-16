import type {
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IDataObject,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject
} from 'n8n-workflow';

import { NodeApiError } from 'n8n-workflow';

import type { OptionsWithUri } from 'request';

export class StatamicEvents implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Statamic Events Trigger',
		name: 'statamicEvents',
		icon: 'file:statamic.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a Statamic Event occurs.',
		defaults: {
			name: 'Statamic Events Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'StatamicPrivateApi',
				required: true
			}
		],
		requestDefaults: {
			baseURL: '={{$credentials.domain.replace(new RegExp("/$"), "")}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'responseNode',
				path: 'webhook'
			}
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'multiOptions',
				default: '',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getEvents',
				},
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Parsed as Antlers: `event` and `eventName` are available as variables'
			},
			{
				displayName: 'Payload body',
				name: 'payload',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
			},
			{
				displayName: 'Payload content type',
				name: 'payload_content_type',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Parse payload as antlers',
				name: 'payload_antlers_parse',
				type: 'boolean',
				default: false,
				description: 'Parsed payload as Antlers: `trigger_event` and all event properties are available as variables'
			},
			{
				displayName: 'Blocking',
				name: 'should_queue',
				type: 'boolean',
				default: true,
				required: true,
				description: 'Define if the handling is sync or async. Make sure to return fast if it is blocking'
			},
			{
				displayName: 'Throw Exception On Fail',
				name: 'throw_exception_on_fail',
				type: 'boolean',
				default: true,
				required: true,
				description: 'Throw an exception in Statamic if the '
			},
		],
	};
	
	methods = {
		loadOptions: {
			async getEvents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('StatamicPrivateApi');
				
				const options: OptionsWithUri = {
					headers: {
						Authorization: `Bearer ${credentials.token}`,
						'Content-Type': 'application/json',
					},
					method: 'GET',
					qs: { limit: 10000 },
					uri: credentials.domain + '/statamic-events/events',
					json: true,
					rejectUnauthorized: false,
				};
				
				const responseData = await this.helpers.request(options);

				if (responseData.data === undefined) {
					throw new NodeApiError(this.getNode(), responseData as JsonObject, {
						message: 'No data got returned',
					});
				}

				const returnData: INodePropertyOptions[] = [];
				for (const event in responseData.data) {

					returnData.push({
						name: responseData.data[event],
						value: event,
					});
				}

				returnData.sort((a, b) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				});

				return returnData;
			},
		}
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				const credentials = await this.getCredentials('StatamicPrivateApi');				

				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				
				const options: OptionsWithUri = {
					headers: {
						Authorization: `Bearer ${credentials.token}`,
						'Content-Type': 'application/json',
					},
					method: 'GET',
					qs: { limit: 10000 },
					uri: credentials.domain + '/statamic-events/handlers',
					json: true,
					rejectUnauthorized: false,
				};
				
				const { data } = await this.helpers.request(options);
								
				for (const handlers of data) {
					if (handlers.driver == 'webhook' && handlers.url === webhookUrl) {
						webhookData.webhookId = handlers.id;
						
						// return true; - we dont return true as we want to patch the webhook in case values have changed
					}
				}

				// If it did not error then the webhook exists
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const node = this.getNode();

				if (webhookUrl.includes('%20')) {
					return false;
				}

				const event = this.getNodeParameter('event');
				
				const payloadContentType = this.getNodeParameter('payload_content_type') as string;
				
				const credentials = await this.getCredentials('StatamicPrivateApi');	
								
				let payload = {
					driver: 'webhook',
					events: event,
					title: 'N8N ' + node.id,
					url: webhookUrl,
					method: 'post',
					should_queue: ! (this.getNodeParameter('should_queue') as boolean),
					authentication_type: 'none',
					enabled: true,
					throw_exception_on_fail: this.getNodeParameter('throw_exception_on_fail') as boolean,
					filter: {
						code: this.getNodeParameter('filter') as string,
					},
					payload: (this.getNodeParameter('payload') as string) ?? null,
					payload_antlers_parse: this.getNodeParameter('payload_antlers_parse') as boolean,
					payload_content_type:  payloadContentType ? payloadContentType : 'application/json',
				};	
								
				const options: OptionsWithUri = {
					headers: {
						Authorization: `Bearer ${credentials.token}`,
						'Content-Type': 'application/json',
					},
					method: webhookData.webhookId ? 'PATCH' : 'POST',
					body: payload,
					uri: credentials.domain + '/statamic-events/handlers' + (webhookData.webhookId ? '/' + webhookData.webhookId : ''),
					json: true,
					rejectUnauthorized: false,
				};

				const responseData = await this.helpers.request(options);

				if (responseData.data === undefined || responseData.data.id === undefined) {
					// Required data is missing so was not successful
					return false;
				}

				webhookData.webhookId = responseData.data.id as string;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {

					try {
						const credentials = await this.getCredentials('StatamicPrivateApi');	
						
						const options: OptionsWithUri = {
							headers: {
								Authorization: `Bearer ${credentials.token}`,
								'Content-Type': 'application/json',
							},
							method: 'PATCH',
							uri: credentials.domain + '/statamic-events/handlers/' + webhookData.webhookId,
							body: {
								enabled: false,
							},
							json: true,
							rejectUnauthorized: false,
						};			

						await this.helpers.request(options);
					} catch (error) {
						return false;
					}

					delete webhookData.webhookId;
					delete webhookData.webhookEvents;
					delete webhookData.hookSecret;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		//const bodyData = this.getBodyData();
		const headerData = this.getHeaderData() as IDataObject;
		const req = this.getRequestObject();

		const webhookData = this.getWorkflowStaticData('node');

		if (headerData['x-hook-secret'] !== undefined) {
			// Is a create webhook confirmation request
			webhookData.hookSecret = headerData['x-hook-secret'];

			const res = this.getResponseObject();
			res.set('X-Hook-Secret', webhookData.hookSecret as string);
			res.status(200).end();

			return {
				noWebhookResponse: true,
			};
		}

		// if (
		// 	bodyData.events === undefined ||
		// 	!Array.isArray(bodyData.events) ||
		// 	bodyData.events.length === 0
		// ) {
		// 	// Does not contain any event data so nothing to process so no reason to
		// 	// start the workflow
		// 	return {};
		// }

		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject[])],
		};
	}
}
