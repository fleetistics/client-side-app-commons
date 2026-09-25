/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IFormFile } from '../models/IFormFile';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientLogService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiClientLog(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/client-log',
        });
    }
    /**
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static postApiClientLogPack(
        formData: {
            UserDescription?: string;
            IssueContext?: string;
            ClientSideInfo?: string;
            ClientSideDate?: string;
            File?: IFormFile;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/client-log-pack',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
