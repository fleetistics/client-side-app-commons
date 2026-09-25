/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompleteUserEmergencyAlertDto } from '../models/CompleteUserEmergencyAlertDto';
import type { CreateUserEmergencyAlertDto } from '../models/CreateUserEmergencyAlertDto';
import type { MyUserEmergencyAlertDto } from '../models/MyUserEmergencyAlertDto';
import type { UserEmergencyAlertDto } from '../models/UserEmergencyAlertDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserEmergencyService {
    /**
     * @param requestBody
     * @returns UserEmergencyAlertDto Created
     * @throws ApiError
     */
    public static postApiUsersMeEmergencyAlert(
        requestBody: CreateUserEmergencyAlertDto,
    ): CancelablePromise<UserEmergencyAlertDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/me/emergency-alert',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MyUserEmergencyAlertDto OK
     * @throws ApiError
     */
    public static getApiUsersMeActiveEmergencyAlert(): CancelablePromise<MyUserEmergencyAlertDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/active-emergency-alert',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns UserEmergencyAlertDto OK
     * @throws ApiError
     */
    public static postApiUsersMeEmergencyAlertComplete(
        requestBody: CompleteUserEmergencyAlertDto,
    ): CancelablePromise<UserEmergencyAlertDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/me/emergency-alert/complete',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
