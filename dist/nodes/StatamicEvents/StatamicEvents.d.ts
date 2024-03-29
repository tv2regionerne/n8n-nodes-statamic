import type { IHookFunctions, ILoadOptionsFunctions, IWebhookFunctions, INodePropertyOptions, INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';
export declare class StatamicEvents implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getEvents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    webhookMethods: {
        default: {
            checkExists(this: IHookFunctions): Promise<boolean>;
            create(this: IHookFunctions): Promise<boolean>;
            delete(this: IHookFunctions): Promise<boolean>;
        };
    };
    webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>;
}
