/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTeamDto } from '../models/CreateTeamDto';
import type { TeamDto } from '../models/TeamDto';
import type { TeamPatchDto } from '../models/TeamPatchDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamService {
    /**
     * @param requestBody
     * @returns TeamDto Created
     * @throws ApiError
     */
    public static postApiTeam(
        requestBody: CreateTeamDto,
    ): CancelablePromise<TeamDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/team',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param teamId
     * @returns TeamDto OK
     * @throws ApiError
     */
    public static getApiTeam(
        teamId: number,
    ): CancelablePromise<TeamDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/{teamId}',
            path: {
                'teamId': teamId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param teamId
     * @param requestBody
     * @returns TeamDto OK
     * @throws ApiError
     */
    public static patchApiTeam(
        teamId: number,
        requestBody: TeamPatchDto,
    ): CancelablePromise<TeamDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/team/{teamId}',
            path: {
                'teamId': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param teamId
     * @returns TeamDto OK
     * @throws ApiError
     */
    public static getApiTeamDetails(
        teamId: number,
    ): CancelablePromise<TeamDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/{teamId}/details',
            path: {
                'teamId': teamId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param teamId
     * @param requestBody
     * @returns TeamDto OK
     * @throws ApiError
     */
    public static patchApiTeamDetails(
        teamId: number,
        requestBody: TeamPatchDto,
    ): CancelablePromise<TeamDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/team/{teamId}/details',
            path: {
                'teamId': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }
}
