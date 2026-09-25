/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IFormFile } from '../models/IFormFile';
import type { UploadedMediaDto } from '../models/UploadedMediaDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MediaService {
    /**
     * @param formData
     * @returns UploadedMediaDto OK
     * @throws ApiError
     */
    public static postApiMediaUpload(
        formData: {
            File?: IFormFile;
            OriginalFileName?: string;
            MediaType?: number;
            Guid?: string;
        },
    ): CancelablePromise<UploadedMediaDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/media/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
