"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatamicPrivateApi = void 0;
class StatamicPrivateApi {
    constructor() {
        this.name = 'StatamicPrivateApi';
        this.displayName = 'Statamic Private API';
        this.documentationUrl = 'https://statamic.com/addons/tv2reg/private-api';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{"Bearer " + $credentials.token}}',
                },
            },
        };
    }
}
exports.StatamicPrivateApi = StatamicPrivateApi;
//# sourceMappingURL=StatamicPrivateApi.credentials.js.map