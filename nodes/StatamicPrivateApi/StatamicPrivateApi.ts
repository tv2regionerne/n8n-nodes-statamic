import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class StatamicPrivateApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Statamic Private API',
		name: 'StatamicPrivateApi',
		icon: 'file:statamic.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interface with Statamic Private API',
		defaults: {
			name: 'Statamic Private API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'StatamicPrivateApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.domain.replace(new RegExp("/$"), "")}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Asset Containers',
						value: 'asset-containers',
					},
					{
						name: 'Collections',
						value: 'collections',
					},
					{
						name: 'Collection Entries',
						value: 'collection-entries',
					},
					{
						name: 'Forms',
						value: 'forms',
					},
					{
						name: 'Globals',
						value: 'globals',
					},
					{
						name: 'Navigations',
						value: 'navs',
					},
					{
						name: 'Taxonomies',
						value: 'taxonomies',
					},
					{
						name: 'Taxonomy Terms',
						value: 'taxonomy-terms',
					},
					{
						name: 'Users',
						value: 'users',
					},
				],
				default: 'collectionEntries',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'asset-containers',
							'collections',
							'forms',
							'globals',
							'navs',
							'taxonomies',
							'users',
						],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get all',
						description: 'Get all',
						routing: {
							request: {
								method: 'GET',
								url: '=/{{ $parameter["resource"] }}',
							},
						},
					},

					{
						name: 'Get one',
						value: 'show',
						action: 'Get one',
						description: 'Get one',
						routing: {
							request: {
								method: 'GET',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Post',
						value: 'post',
						action: 'Create',
						description: 'Create',
						routing: {
							request: {
								method: 'POST',
								url: '=/{{ $parameter["resource"] }}',
							},
						},
					},

					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete',
						description: 'Delete',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Patch',
						value: 'patch',
						action: 'Update',
						description: 'Update',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["id"] }}',
							},
						},
					},
				],
				default: 'get',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'collection-entries',
						],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get all',
						description: 'Get all',
						routing: {
							request: {
								method: 'GET',
								url: '=/collections/{{ $parameter["collection"] }}/entries',
							},
						},
					},

					{
						name: 'Get one',
						value: 'show',
						action: 'Get one',
						description: 'Get one',
						routing: {
							request: {
								method: 'GET',
								url: '=/collections/{{ $parameter["collection"] }}/entries/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Post',
						value: 'post',
						action: 'Create',
						description: 'Create',
						routing: {
							request: {
								method: 'POST',
								url: '=/collections/{{ $parameter["collection"] }}/entries',
							},
						},
					},

					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete',
						description: 'Delete',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/collections/{{ $parameter["collection"] }}/entries/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Patch',
						value: 'patch',
						action: 'Update',
						description: 'Update',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/collections/{{ $parameter["collection"] }}/entries/{{ $parameter["id"] }}',
							},
						},
					},
				],
				default: 'get',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'taxonomy-terms',
						],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get all',
						description: 'Get all',
						routing: {
							request: {
								method: 'GET',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["taxonomy"] }}/terms',
							},
						},
					},

					{
						name: 'Get one',
						value: 'show',
						action: 'Get one',
						description: 'Get one',
						routing: {
							request: {
								method: 'GET',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["taxonomy"] }}/terms/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Post',
						value: 'post',
						action: 'Create',
						description: 'Create',
						routing: {
							request: {
								method: 'POST',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["taxonomy"] }}/terms',
							},
						},
					},

					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete',
						description: 'Delete',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["taxonomy"] }}/terms/{{ $parameter["id"] }}',
							},
						},
					},

					{
						name: 'Patch',
						value: 'patch',
						action: 'Update',
						description: 'Update',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/{{ $parameter["resource"] }}/{{ $parameter["taxonomy"] }}/terms/{{ $parameter["id"] }}',
							},
						},
					},
				],
				default: 'get',
			},

			{
				displayName: 'Collection',
				name: 'collection',
				type: 'string',
				required: true,
				default: '',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'collection-entries',
						],
					},
				},
			},

			{
				displayName: 'Taxonomy',
				name: 'taxonomy',
				type: 'string',
				required: true,
				default: '',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'taxonomy-terms',
						],
					},
				},
			},

			{
				displayName: 'Item',
				name: 'id',
				type: 'string',
				required: true,
				default: '',
				noDataExpression: true,
				displayOptions: {
					show: {
						operation: [
							'show',
							'patch',
							'delete',
						],
					},
				},
			},
		]
	};
}
