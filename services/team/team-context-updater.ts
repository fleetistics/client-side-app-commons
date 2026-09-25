
import type { TeamContext, TeamMapItem } from '@/app.Commons/services/team/team-context';
import { TeamMapIcon, TeamUserRole } from '@/app.Commons/dataLayer/model/team/team-const';
import { ActiveUserEmergencyAlertDto, MobileGpsDeviceDto, TeamContextDelta, TeamMemberUserDto, UserDto } from '@/app.Commons/dataLayer/open-api';

export type TeamContextChangeFlags = {

    header: boolean;
    members: boolean;
    mapItems: boolean;
    messages: boolean;
    users: boolean;
};

export function applyTeamContextDelta(context: TeamContext, delta: TeamContextDelta): TeamContextChangeFlags {
    let res = {
        header: false, members: false, mapItems: false, messages: false
    } as TeamContextChangeFlags;

    if (!context.MapStates) context.MapStates = [];

    if (delta.TeamHeader || delta.TeamDetails || delta.TeamUploadedMedias?.length || delta.RemoveTeamMediaIds?.length) {
        if (delta.TeamHeader) context.TeamHeader = delta.TeamHeader;
        if (delta.TeamDetails) context.TeamDetails = delta.TeamDetails;
        if (delta.TeamUploadedMedias?.length) {
            if (!context.TeamUploadedMedias) context.TeamUploadedMedias = [];
            context.TeamUploadedMedias.push(...delta.TeamUploadedMedias);
        }
        if (context.TeamUploadedMedias?.length && delta.RemoveTeamMediaIds?.length) {
            delta.RemoveTeamMediaIds?.forEach((id) => {
                let tmpIdx = context.TeamUploadedMedias!.findIndex(e => e.Id == id);
                if (tmpIdx >= 0) context.TeamUploadedMedias?.splice(tmpIdx, 1);
            });
        }

        res.header = true;
    }
    context.UnknownUserIds = new Set<number>();
    if (!context.Users) context.Users = new Map<number, UserDto>();
    let updateMapStates_byMembers = new Set<number>();
    let updateMapStates_byUsers = new Set<number>();
    let updateMapStates_byAlerts = new Set<number>();
    let updateMapStates_byPrimaryTarget = new Set<number>();

    if (delta.RemoveUserIds?.length) {
        delta.RemoveUserIds?.forEach((id) => {
            context.Users?.delete(id);
        });
    }
    if (delta.Users?.length) {

        delta.Users?.forEach((user) => {
            context.Users?.set(user.Id!, user);
            updateMapStates_byUsers.add(user.Id!);
            context.UnknownUserIds?.delete(user.Id!);
        });
        res.users = true;
    }

    if (delta.GpsDeviceMapStates?.length) {
        delta.GpsDeviceMapStates?.forEach((state) => {
            let tmpMapStates = context.MapStates!.find(e => e.MobileGpsDeviceId == state.MobileGpsDeviceId);
            if (!tmpMapStates) {
                tmpMapStates = {
                    MobileGpsDeviceId: state.MobileGpsDeviceId,
                    UserId: state.UserId,
                    Label: 'Unknown'
                } as TeamMapItem;
                context.MapStates!.push(tmpMapStates);
                updateMapStates_byUsers.add(state.UserId!);
                updateMapStates_byMembers.add(state.UserId!);
                updateMapStates_byAlerts.add(state.UserId!);
                updateMapStates_byPrimaryTarget.add(state.UserId!);
            }
            if (!context.Users?.get(state.UserId!)) context.UnknownUserIds?.add(state.UserId!);
            tmpMapStates.LatestOnMapUpdate = state.LatestOnMapUpdate!;
            tmpMapStates.Latitude = state.Latitude!;
            tmpMapStates.Longitude = state.Longitude!;

        });
        res.mapItems = true;
    }



    if (delta.RemoveMobileGpsDeviceIds?.length) {
        delta.RemoveMobileGpsDeviceIds?.forEach((id) => {
            let tmpIdx = context.MapStates!.findIndex(e => e.MobileGpsDeviceId == id);
            if (tmpIdx >= 0) {
                context.MapStates?.splice(tmpIdx, 1);
                res.mapItems = true;
            }
            if (context.MobileGpsDevices) {
                for (const [key, value] of context.MobileGpsDevices) {
                    const index = value.findIndex(d => d.Id === id);
                    if (index !== -1) {
                        value.splice(index, 1);
                        if (value.length === 0) {
                            context.MobileGpsDevices.delete(key);
                        }
                        break;
                    }
                }
            }
        });
    }
    if (delta.MobileGpsDevices?.length) {
        delta.MobileGpsDevices.forEach((device) => {
            if (!context.MobileGpsDevices) context.MobileGpsDevices = new Map<number, Array<MobileGpsDeviceDto>>();
            updateMapStates_byUsers.add(device.UserId!);
            const existing = context.MobileGpsDevices.get(device.UserId!);
            if (!existing) {
                context.MobileGpsDevices.set(device.UserId!, [device]);
            } else {
                const index = existing.findIndex(d => d.Id === device.Id);
                if (index !== -1) {
                    existing[index] = device;
                } else {
                    existing.push(device);
                }
            }
        });
    }
    if (delta.RemoveUserAlertIds?.length) {
        delta.RemoveUserAlertIds?.forEach((id) => {
            context.UserAlerts?.delete(id);
            updateMapStates_byAlerts.add(id);
        });
    }
    if (delta.UserAlerts?.length) {
        delta.UserAlerts.forEach((alert) => {
            if (!context.UserAlerts) context.UserAlerts = new Map<number, ActiveUserEmergencyAlertDto>();
            context.UserAlerts.set(alert.UserId!, alert);
            if (!context.Users?.get(alert.UserId!)) context.UnknownUserIds?.add(alert.UserId!);
            updateMapStates_byAlerts.add(alert.UserId!);
            let tmpMapStates = context.MapStates!.filter(e => e.UserId == alert.UserId);
            if (tmpMapStates?.length) {
                tmpMapStates.forEach(e => e.HasAlert = true);
                res.mapItems = true;
            }
        });
    }
    if (updateMapStates_byAlerts.size) {
        updateMapStates_byAlerts.forEach((userId) => {
            let curAlert = context.UserAlerts?.get(userId);
            let tmpMapStates = context.MapStates!.filter(e => e.UserId == userId);
            if (tmpMapStates?.length) {
                tmpMapStates.forEach(e => e.HasAlert = !!curAlert);
                res.mapItems = true;
            }
        });
    }

    if (delta.DoRemoveTeamPrimaryTargetUser) {
        context.TeamPrimaryTargetUser = undefined;
        let tmpMapStates = context.MapStates!.filter(e => e.HasFocus);
        if (tmpMapStates?.length) {
            tmpMapStates.forEach(e => e.HasFocus = false);
            res.mapItems = true;
        }
    }
    if (delta.TeamPrimaryTargetUser) {
        context.TeamPrimaryTargetUser = delta.TeamPrimaryTargetUser;
        updateMapStates_byPrimaryTarget.add(delta.TeamPrimaryTargetUser.TargetUserId!);
        if (!context.Users?.get(delta.TeamPrimaryTargetUser.TargetUserId!)) context.UnknownUserIds?.add(delta.TeamPrimaryTargetUser.TargetUserId!);
        let tmpMapStates = context.MapStates!.filter(e => e.HasFocus);
        if (tmpMapStates?.length) {
            tmpMapStates.forEach(e => e.HasFocus = false);
            res.mapItems = true;
        }
    }

    if (updateMapStates_byPrimaryTarget.size) {
        updateMapStates_byPrimaryTarget.forEach((targetUserId) => {
            let tmpMapStates = context.MapStates!.filter(e => e.UserId == targetUserId);
            if (tmpMapStates?.length) {
                tmpMapStates.forEach(e => e.HasFocus = true);
                res.mapItems = true;
            }
        });
    }

    if (delta.RemoveMemberUserIds?.length) {
        delta.RemoveMemberUserIds?.forEach((id) => {
            updateMapStates_byMembers.delete(id);
            context.Members?.delete(id);

            while (context.MapStates) {
                let tmpIndex = context.MapStates.findIndex(e => e.UserId == id);
                if (tmpIndex >= 0) {
                    context.MapStates.splice(tmpIndex, 1);
                    res.mapItems = true;
                }
                else break;
            }
        });
        res.members = true;
    }

    if (delta.Members?.length) {
        if (!context.Members) context.Members = new Map<number, TeamMemberUserDto>();
        delta.Members?.forEach((member) => {
            context.Members?.set(member.UserId!, member);
            updateMapStates_byMembers.add(member.UserId!);
            if (!context.Users?.get(member.UserId!)) context.UnknownUserIds?.add(member.UserId!);
        });
        res.members = true;
    }
    if (updateMapStates_byMembers.size) {
        updateMapStates_byMembers.forEach((userId) => {
            let tmpMember = context.Members?.get(userId);
            let tmpMapStates = context.MapStates!.filter(e => e.UserId == userId);
            if (tmpMember && tmpMapStates?.length) {
                switch (tmpMember.RoleId) {
                    case TeamUserRole.Creator:
                        tmpMapStates.forEach(e => e.IconKey = TeamMapIcon.Creator);
                        break;
                    case TeamUserRole.Lead:
                        tmpMapStates.forEach(e => e.IconKey = TeamMapIcon.Lead);
                        break;
                    default:
                        tmpMapStates.forEach(e => e.IconKey = tmpMember.IconKey);
                }
                res.mapItems = true;
            }

        });
    }
    if (updateMapStates_byUsers.size) {
        updateMapStates_byUsers.forEach((userId) => {
            let curUser = context.Users?.get(userId);
            let tmpDevices = context.MobileGpsDevices?.get(userId);
            let tmpMapStates = context.MapStates!.filter(e => e.UserId == userId);
            if (curUser && tmpMapStates?.length) {
                if (!tmpDevices?.length || tmpDevices?.length < 2)
                    tmpMapStates.forEach(e => e.Label = curUser!.DisplayName!);
                else {
                    tmpMapStates.forEach(e => {
                        let tmpDevice = tmpDevices.find(d => d.Id == e.MobileGpsDeviceId);
                        if (tmpDevice) e.Label = curUser!.DisplayName! + ' - ' + tmpDevice.Name;
                        else e.Label = curUser!.DisplayName!;
                    });
                }
                res.mapItems = true;
            }
        });
    }

    if (delta.RemoveUserMessageIds) {
        delta.RemoveUserMessageIds.forEach((id) => {
            let tmpIdx = context.UserMessages!.findIndex(e => e.Id == id);
            if (tmpIdx >= 0) {
                context.UserMessages?.splice(tmpIdx, 1);
                res.messages = true;
            }

        });
    }
    if (delta.UserMessages?.length) {
        if (!context.UserMessages) context.UserMessages = [];
        delta.UserMessages.forEach((message) => {
            let tmpIdx = context.UserMessages!.findIndex(e => e.Id == message.Id);
            if (tmpIdx >= 0) {
                context.UserMessages![tmpIdx] = message;
            }
            else context.UserMessages?.push(message);
            if (!context.Users?.get(message.UserId!)) context.UnknownUserIds?.add(message.UserId!);
            res.messages = true;
        });
    }

    if (delta.TeamActivities) {
        if (!context.TeamActivities) context.TeamActivities = [];
        delta.TeamActivities.forEach((activity) => {
            context.TeamActivities?.push(activity);
            if (!context.Users?.get(activity.UserId!)) context.UnknownUserIds?.add(activity.UserId!);
            res.messages = true;
        });
    }
    if (res.messages) {
        context.UnreadMessagesCount = 0;
        if (context.UserMessages?.length) {
            context.UnreadMessagesCount += context.UserMessages.filter(e => !e.UserReadStatusId).length;
        }
        if (context.TeamActivities?.length) {
            context.UnreadMessagesCount += context.TeamActivities.filter(e => !e.UserReadStatusId).length;
        }
    }
    context.LastCheckForUpdate = delta.LastUpdate!;
    if (res.users) {
        res.messages = true;
        res.members = true;
    }
    if (res.messages) context.LastMessagesUpdate = delta.LastUpdate!;
    if (res.members) context.LastMembersUpdate = delta.LastUpdate!;
    if (res.header) context.LastHeaderUpdate = delta.LastUpdate!;
    return res;
}