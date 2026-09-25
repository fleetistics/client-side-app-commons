/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserCurrentContextService {
    /**
     * @returns number OK
     * @throws ApiError
     */
    public static getApiUsersMeActiveTeamId(): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/active-team-id',
        });
    }
}
