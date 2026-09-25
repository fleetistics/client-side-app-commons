/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActiveUserEmergencyAlertDto } from './ActiveUserEmergencyAlertDto';
import type { MobileGpsDeviceDto } from './MobileGpsDeviceDto';
import type { MobileGpsDeviceMapStateDto } from './MobileGpsDeviceMapStateDto';
import type { TeamActivityDto } from './TeamActivityDto';
import type { TeamDetailsDto } from './TeamDetailsDto';
import type { TeamHeaderDto } from './TeamHeaderDto';
import type { TeamMemberUserDto } from './TeamMemberUserDto';
import type { TeamPrimaryTargetUserDto } from './TeamPrimaryTargetUserDto';
import type { UploadedMediaDto } from './UploadedMediaDto';
import type { UserDto } from './UserDto';
import type { UserMessageDto } from './UserMessageDto';
export type TeamContextDelta = {
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    LastUpdate?: number;
    TeamHeader?: TeamHeaderDto;
    TeamDetails?: TeamDetailsDto;
    TeamUploadedMedias?: Array<UploadedMediaDto>;
    RemoveTeamMediaIds?: Array<number>;
    Members?: Array<TeamMemberUserDto>;
    RemoveMemberUserIds?: Array<number>;
    TeamPrimaryTargetUser?: TeamPrimaryTargetUserDto;
    DoRemoveTeamPrimaryTargetUser?: boolean;
    Users?: Array<UserDto>;
    RemoveUserIds?: Array<number>;
    MobileGpsDevices?: Array<MobileGpsDeviceDto>;
    RemoveMobileGpsDeviceIds?: Array<number>;
    UserAlerts?: Array<ActiveUserEmergencyAlertDto>;
    RemoveUserAlertIds?: Array<number>;
    UserMessages?: Array<UserMessageDto>;
    RemoveUserMessageIds?: Array<number>;
    TeamActivities?: Array<TeamActivityDto>;
    GpsDeviceMapStates?: Array<MobileGpsDeviceMapStateDto>;
};

