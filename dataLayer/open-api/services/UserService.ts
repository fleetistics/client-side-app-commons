/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserDto } from '../models/UserDto';
import type { UserPatchDto } from '../models/UserPatchDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getApiUsersMe(): CancelablePromise<UserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param userId
     * @returns void
     * @throws ApiError
     */
    public static putApiUsers(
        userId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{userId}',
            path: {
                'userId': userId,
            },
            errors: {
                405: `Method Not Allowed`,
            },
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiUsers(
        userId: number,
        requestBody: UserPatchDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static postApiUsers(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            errors: {
                405: `Method Not Allowed`,
            },
        });
    }
}
