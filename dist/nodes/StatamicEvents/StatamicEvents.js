"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatamicEvents = void 0;
class StatamicEvents {
    constructor() {
        this.description = {
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
        this.webhookMethods = {
            default: {
                async checkExists() {
                    const webhookData = this.getWorkflowStaticData('node');
                    const credentials = await this.getCredentials('StatamicPrivateApi');
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    const options = {
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
                            return true;
                        }
                    }
                    return false;
                },
                async create() {
                    const webhookData = this.getWorkflowStaticData('node');
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    if (webhookUrl.includes('%20')) {
                        return false;
                    }
                    const event = this.getNodeParameter('event');
                    const credentials = await this.getCredentials('StatamicPrivateApi');
                    const options = {
                        headers: {
                            Authorization: `Bearer ${credentials.token}`,
                            'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        body: {
                            driver: 'webhook',
                            events: event.split(','),
                            title: webhookUrl,
                            url: webhookUrl,
                            should_queue: true,
                            authentication_type: 'none',
                            enabled: true,
                        },
                        uri: credentials.domain + '/statamic-events/handlers',
                        json: true,
                        rejectUnauthorized: false,
                    };
                    const responseData = await this.helpers.request(options);
                    if (responseData.data === undefined || responseData.data.id === undefined) {
                        return false;
                    }
                    webhookData.webhookId = responseData.data.id;
                    return true;
                },
                async delete() {
                    const webhookData = this.getWorkflowStaticData('node');
                    if (webhookData.webhookId !== undefined) {
                        try {
                            const credentials = await this.getCredentials('StatamicPrivateApi');
                            const options = {
                                headers: {
                                    Authorization: `Bearer ${credentials.token}`,
                                    'Content-Type': 'application/json',
                                },
                                method: 'DELETE',
                                uri: credentials.domain + '/statamic-events/handlers/' + webhookData.webhookId,
                                json: true,
                                rejectUnauthorized: false,
                            };
                            await this.helpers.request(options);
                        }
                        catch (error) {
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
    }
    async webhook() {
        const bodyData = this.getBodyData();
        const headerData = this.getHeaderData();
        const req = this.getRequestObject();
        const webhookData = this.getWorkflowStaticData('node');
        if (headerData['x-hook-secret'] !== undefined) {
            webhookData.hookSecret = headerData['x-hook-secret'];
            const res = this.getResponseObject();
            res.set('X-Hook-Secret', webhookData.hookSecret);
            res.status(200).end();
            return {
                noWebhookResponse: true,
            };
        }
        if (bodyData.events === undefined ||
            !Array.isArray(bodyData.events) ||
            bodyData.events.length === 0) {
            return {};
        }
        return {
            workflowData: [this.helpers.returnJsonArray(req.body.events)],
        };
    }
}
exports.StatamicEvents = StatamicEvents;
//# sourceMappingURL=StatamicEvents.js.map