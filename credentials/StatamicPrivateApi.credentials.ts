import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StatamicPrivateApi implements ICredentialType {
	name = 'StatamicPrivateApi';
	displayName = 'Statamic Private API';
	documentationUrl = 'https://statamic.com/addons/tv2reg/private-api';
	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: 'https://yoursite.statamic.com/api/private',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
			},
		},
	};
}
