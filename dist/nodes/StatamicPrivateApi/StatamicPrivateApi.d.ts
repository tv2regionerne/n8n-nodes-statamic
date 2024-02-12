import { INodeType, INodeTypeDescription, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
export declare class StatamicPrivateApi implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getCollections(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaxonomies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
}
