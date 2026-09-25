/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserEmergencyAlertDto = {
    Id?: number;
    UserId?: number;
    MobileGpsDeviceId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CreatedDate?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CompletedDate?: number;
    Latitude?: number;
    Longitude?: number;
    CompleteLatitude?: number;
    CompleteLongitude?: number;
    StatusId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    LatestUpdate?: number;
};

