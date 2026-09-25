/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserSettingsDto } from '../models/UserSettingsDto';
import type { UserSettingsPutDto } from '../models/UserSettingsPutDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserSettingsService {
    /**
     * @param clientApplicationId
     * @param clientDevicePlatformId
     * @returns UserSettingsDto OK
     * @throws ApiError
     */
    public static getApiUsersMeSettings(
        clientApplicationId?: number,
        clientDevicePlatformId?: number,
    ): CancelablePromise<Array<UserSettingsDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/settings',
            query: {
                'clientApplicationId': clientApplicationId,
                'clientDevicePlatformId': clientDevicePlatformId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns UserSettingsDto OK
     * @throws ApiError
     */
    public static putApiUsersMeSettings(
        requestBody: UserSettingsPutDto,
    ): CancelablePromise<UserSettingsDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/me/settings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
