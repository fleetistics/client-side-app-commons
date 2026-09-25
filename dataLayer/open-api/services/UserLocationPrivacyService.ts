/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserLocationPrivacyDto } from '../models/UserLocationPrivacyDto';
import type { UserLocationPrivacyPatchDto } from '../models/UserLocationPrivacyPatchDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserLocationPrivacyService {
    /**
     * @returns UserLocationPrivacyDto OK
     * @throws ApiError
     */
    public static getApiUsersMeLocationPrivacy(): CancelablePromise<UserLocationPrivacyDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/location-privacy',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns UserLocationPrivacyDto OK
     * @throws ApiError
     */
    public static patchApiUsersMeLocationPrivacy(
        requestBody: UserLocationPrivacyPatchDto,
    ): CancelablePromise<UserLocationPrivacyDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/location-privacy',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
