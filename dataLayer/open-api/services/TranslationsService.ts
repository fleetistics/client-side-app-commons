/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LanguageDto } from '../models/LanguageDto';
import type { ReportUnknownTranslationsDto } from '../models/ReportUnknownTranslationsDto';
import type { TranslationTableDto } from '../models/TranslationTableDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TranslationsService {
    /**
     * @returns LanguageDto OK
     * @throws ApiError
     */
    public static getApiLanguages(): CancelablePromise<Array<LanguageDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/languages',
        });
    }
    /**
     * @param lang
     * @param since
     * @returns TranslationTableDto OK
     * @throws ApiError
     */
    public static getApiTranslations(
        lang: string,
        since?: number,
    ): CancelablePromise<TranslationTableDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/translations/{lang}',
            path: {
                'lang': lang,
            },
            query: {
                'since': since,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiTranslationsReport(
        requestBody: ReportUnknownTranslationsDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/translations/report',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
