/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamContextDelta } from '../models/TeamContextDelta';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamContextService {
    /**
     * @param teamId
     * @returns TeamContextDelta OK
     * @throws ApiError
     */
    public static getApiTeamContext(
        teamId: number,
    ): CancelablePromise<TeamContextDelta> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/{teamId}/context',
            path: {
                'teamId': teamId,
            },
            errors: {
                403: `Forbidden`,
                410: `Gone`,
            },
        });
    }
    /**
     * @param teamId
     * @param latestUpdateDate
     * @param notTeamUserIds
     * @param requestedUserIds
     * @returns TeamContextDelta OK
     * @throws ApiError
     */
    public static getApiTeamContextDelta(
        teamId: number,
        latestUpdateDate?: number,
        notTeamUserIds?: Array<number>,
        requestedUserIds?: Array<number>,
    ): CancelablePromise<TeamContextDelta> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/{teamId}/context/delta',
            path: {
                'teamId': teamId,
            },
            query: {
                'latestUpdateDate': latestUpdateDate,
                'notTeamUserIds': notTeamUserIds,
                'requestedUserIds': requestedUserIds,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                410: `Gone`,
            },
        });
    }
}
