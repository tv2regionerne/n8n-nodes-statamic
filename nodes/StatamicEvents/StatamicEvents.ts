import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	IHttpRequestOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData
} from 'n8n-workflow';

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
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook'
			}
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'string',
				default: '',
				required: true,
				description: 'The event(s) to subscribe to (eg \Statamic\Events\EntrySaved), comma seperated'
			}
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				const options: IHttpRequestOptions = {
					headers: {},
					method: 'GET',
					qs: { limit: 10000 },
					url: '/statamic-events/handlers',
					json: true,
				};

				const { data } = await this.helpers.requestWithAuthentication.call(this, 'StatamicPrivateApi', options);

				for (const handlers of data) {
					if (handlers.driver == 'webhook' && handlers.url === webhookUrl) {
						webhookData.webhookId = handlers.id;
						return true;
					}
				}

				// If it did not error then the webhook exists
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (webhookUrl.includes('%20')) {
					return false;
				}

				const event = this.getNodeParameter('event') as string;

				const options: IHttpRequestOptions = {
					headers: {},
					method: 'POST',
					url: '/statamic-events/handlers',
					body: {
						driver: 'webhook',
						events: event.split(','),
						title: webhookUrl,
						url: webhookUrl,
					},
					json: true,
				};

				const responseData = await this.helpers.requestWithAuthentication.call(this, 'StatamicPrivateApi', options);

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

						const options: IHttpRequestOptions = {
							headers: {},
							method: 'DELETE',
							url: '/statamic-events/handlers/' + webhookData.webhookId,
							json: true,
						};

						await this.helpers.requestWithAuthentication.call(this, 'StatamicPrivateApi', options);
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
		const bodyData = this.getBodyData();
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

		if (
			bodyData.events === undefined ||
			!Array.isArray(bodyData.events) ||
			bodyData.events.length === 0
		) {
			// Does not contain any event data so nothing to process so no reason to
			// start the workflow
			return {};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(req.body.events as IDataObject[])],
		};
	}
}
