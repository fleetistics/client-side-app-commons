import type {
    UserDto,
    TeamMemberUserDto,
    ActiveUserEmergencyAlertDto,
    MobileGpsDeviceDto,
    TeamHeaderDto,
    TeamDetailsDto,
    UploadedMediaDto,
    TeamPrimaryTargetUserDto,
    UserMessageDto,
    TeamActivityDto,
} from '@/app.Commons/dataLayer/open-api';



export type TeamMapItem = {
    UserId: number;
    MobileGpsDeviceId: number;
    Latitude: number;
    Longitude: number;
    LatestOnMapUpdate: number;
    IconKey?: number;
    HasAlert?: boolean;
    HasFocus?: boolean;
    Label: string;
    Color?: string;
}

export type TeamContext = {
    LastCheckForUpdate: number;
    LastHeaderUpdate: number;
    LastMembersUpdate: number;
    LastMessagesUpdate: number;

    TeamHeader: TeamHeaderDto;
    TeamDetails?: TeamDetailsDto;
    TeamUploadedMedias?: Array<UploadedMediaDto>;
    TeamPrimaryTargetUser?: TeamPrimaryTargetUserDto;

    Members?: Map<number, TeamMemberUserDto>;
    Users?: Map<number, UserDto>;
    UserAlerts?: Map<number, ActiveUserEmergencyAlertDto>;
    MobileGpsDevices?: Map<number, Array<MobileGpsDeviceDto>>;
    UserMessages?: Array<UserMessageDto>;
    TeamActivities?: Array<TeamActivityDto>;
    UnreadMessagesCount: number;

    MapStates?: TeamMapItem[];

    UnknownUserIds?: Set<number>;
    NotTeamUserIds?: Set<number>;
};

export type TeamHeaderContext = {
    LastUpdate: number;
    LastCheckForUpdate: number;
    TeamHeader: TeamHeaderDto;
    TeamDetails?: TeamDetailsDto;
    TeamUploadedMedias?: Array<UploadedMediaDto>;
};
export type TeamMembersContext = {
    LastUpdate: number;
    LastCheckForUpdate: number;
    Members?: Map<number, TeamMemberUserDto>;
    Users?: Map<number, UserDto>;
    TeamPrimaryTargetUser?: TeamPrimaryTargetUserDto;
};
export type TeamMessagesContext = {
    LastUpdate: number;
    LastCheckForUpdate: number;
    UserMessages?: Array<UserMessageDto>;
    TeamActivities?: Array<TeamActivityDto>;
    Users?: Map<number, UserDto>;
    UnreadMessagesCount: number;
};
export type TeamMapItemsContext = {
    LastCheckForUpdate: number;
    MapStates?: TeamMapItem[];
};
