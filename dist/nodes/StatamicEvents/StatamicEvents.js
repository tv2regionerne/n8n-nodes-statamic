"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatamicEvents = void 0;
const n8n_workflow_1 = require("n8n-workflow");
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
        this.methods = {
            loadOptions: {
                async getEvents() {
                    const credentials = await this.getCredentials('StatamicPrivateApi');
                    const options = {
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
                        throw new n8n_workflow_1.NodeApiError(this.getNode(), responseData, {
                            message: 'No data got returned',
                        });
                    }
                    const returnData = [];
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
                        }
                    }
                    return false;
                },
                async create() {
                    var _a;
                    const webhookData = this.getWorkflowStaticData('node');
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    const node = this.getNode();
                    if (webhookUrl.includes('%20')) {
                        return false;
                    }
                    const event = this.getNodeParameter('event');
                    console.log(event);
                    const payloadContentType = this.getNodeParameter('payload_content_type');
                    const credentials = await this.getCredentials('StatamicPrivateApi');
                    let payload = {
                        driver: 'webhook',
                        events: event,
                        title: 'N8N ' + node.id,
                        url: webhookUrl,
                        method: 'post',
                        should_queue: !this.getNodeParameter('should_queue'),
                        authentication_type: 'none',
                        enabled: true,
                        throw_exception_on_fail: this.getNodeParameter('throw_exception_on_fail'),
                        filter: {
                            code: this.getNodeParameter('filter'),
                        },
                        payload: (_a = this.getNodeParameter('payload')) !== null && _a !== void 0 ? _a : null,
                        payload_antlers_parse: this.getNodeParameter('payload_antlers_parse'),
                        payload_content_type: payloadContentType ? payloadContentType : 'application/json',
                    };
                    const options = {
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
                                method: 'PATCH',
                                uri: credentials.domain + '/statamic-events/handlers/' + webhookData.webhookId,
                                body: {
                                    enabled: false,
                                },
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
        return {
            workflowData: [this.helpers.returnJsonArray(req.body)],
        };
    }
}
exports.StatamicEvents = StatamicEvents;
//# sourceMappingURL=StatamicEvents.js.map