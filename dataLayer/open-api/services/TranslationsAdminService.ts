/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateLanguageDto } from '../models/CreateLanguageDto';
import type { LanguageDto } from '../models/LanguageDto';
import type { TranslationEntryDto } from '../models/TranslationEntryDto';
import type { TranslationTokenAdminDto } from '../models/TranslationTokenAdminDto';
import type { UpdateTranslationDto } from '../models/UpdateTranslationDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TranslationsAdminService {
    /**
     * @returns LanguageDto OK
     * @throws ApiError
     */
    public static getApiLanguagesAll(): CancelablePromise<Array<LanguageDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/languages/all',
        });
    }
    /**
     * @param requestBody
     * @returns LanguageDto OK
     * @throws ApiError
     */
    public static postApiLanguages(
        requestBody: CreateLanguageDto,
    ): CancelablePromise<LanguageDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/languages',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param lang
     * @returns TranslationTokenAdminDto OK
     * @throws ApiError
     */
    public static getApiTranslationsTokens(
        lang: string,
    ): CancelablePromise<Array<TranslationTokenAdminDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/translations/{lang}/tokens',
            path: {
                'lang': lang,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param lang
     * @param tokenId
     * @param requestBody
     * @returns TranslationEntryDto OK
     * @throws ApiError
     */
    public static patchApiTranslations(
        lang: string,
        tokenId: number,
        requestBody: UpdateTranslationDto,
    ): CancelablePromise<TranslationEntryDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/translations/{lang}/{tokenId}',
            path: {
                'lang': lang,
                'tokenId': tokenId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
