import { useSyncExternalStore } from 'react';

import { APP_CONFIG } from '@/app.Impl/configs/app-config';
import { APP_URLS } from '@/app.Impl/configs/app-urls';
import {
  AuthToken,
  createStandaloneRefreshApi,
  notifyAuthLost,
  refreshAccessToken,
} from '@/client-side.Commons/dataLayer/core/apiSlice';
import { GetIsAppActive, SubscribeIsAppActive } from '@/app.Commons/services/app-state-context';

import type {
  TeamContext,
  TeamHeaderContext,
  TeamMapItem,
  TeamMapItemsContext,
  TeamMembersContext,
  TeamMessagesContext,
} from '@/app.Commons/services/team/team-context';

import { TeamContextDelta } from '@/app.Commons/dataLayer/open-api';
import { applyTeamContextDelta } from './team-context-updater';

type ChangeListener = () => void;
type Group = 'header' | 'members' | 'mapItems' | 'messages';

const EMPTY_MAP_ITEMS: TeamMapItem[] = [];

function buildHeaderSnapshot(context: TeamContext): TeamHeaderContext {
  return {
    LastUpdate: context.LastHeaderUpdate,
    LastCheckForUpdate: context.LastCheckForUpdate,
    TeamHeader: context.TeamHeader,
    TeamDetails: context.TeamDetails,
    TeamUploadedMedias: context.TeamUploadedMedias,
  };
}
function buildMembersSnapshot(context: TeamContext): TeamMembersContext {
  return {
    LastUpdate: context.LastMembersUpdate,
    LastCheckForUpdate: context.LastCheckForUpdate,
    Members: context.Members,
    Users: context.Users,
    TeamPrimaryTargetUser: context.TeamPrimaryTargetUser,
  };
}
function buildMessagesSnapshot(context: TeamContext): TeamMessagesContext {
  return {
    LastUpdate: context.LastMessagesUpdate,
    LastCheckForUpdate: context.LastCheckForUpdate,
    UserMessages: context.UserMessages,
    TeamActivities: context.TeamActivities,
    Users: context.Users,
    UnreadMessagesCount: context.UnreadMessagesCount,
  };
}

function buildMapItemsSnapshot(context: TeamContext): TeamMapItemsContext {
  return {
    LastCheckForUpdate: context.LastCheckForUpdate,
    MapStates: context.MapStates ?? EMPTY_MAP_ITEMS,
  };
}

/**
 * Tracks a single team's context: an initial full snapshot (GET .../context) followed by
 * periodic delta polling (GET .../context/delta) while the team stays current and the app
 * is foregrounded. Static, like MediaUploadService - created once at app start via Create()
 * and otherwise dormant until StartTeam(teamId) is called.
 */
export class TeamContextService {
  public static Create(): void {
    console.log('TeamContextService::Create');
    this.getInstance();
  }

  /** Starts (or switches to) tracking one team. Only one team is ever tracked at a time:
   * calling this with the team already current is a no-op; calling it with a different
   * teamId stops the previous team's polling and starts fresh with the new one. */
  public static StartTeam(teamId: number): void {
    this.getInstance().startTeam(teamId);
  }

  public static get CurrentTeamId(): number | undefined {
    return this.getInstance().mCurrentTeamId;
  }

  /** Always-current TeamContext - for imperative/non-reactive reads. Components should use
   * the useTeamHeader/useTeamMembers/useTeamMapItems hooks instead, which only re-render
   * for the specific fields each one cares about. */
  public static get TeamContext(): TeamContext {
    return this.getInstance().mContext;
  }

  /** A snapshot that only gets a new object identity when TeamHeader/TeamDetails/
   * TeamUploadedMedias actually changed - see useTeamHeader() below. Exists purely to give
   * useSyncExternalStore a reference that changes exactly when useTeamHeader's consumers
   * care about it changing. */
  public static get HeaderSnapshot(): TeamHeaderContext {
    return this.getInstance().mHeaderSnapshot;
  }

  /** A snapshot that only gets a new object identity when Members/Users/UserAlerts/
   * TeamPrimaryTargetUser actually changed - see useTeamMembers() below. */
  public static get MembersSnapshot(): TeamMembersContext {
    return this.getInstance().mMembersSnapshot;
  }

  /** A snapshot that only gets a new object identity when UserMessages/TeamActivities
   * actually changed - see useTeamMessages() below. */
  public static get MessagesSnapshot(): TeamMessagesContext {
    return this.getInstance().mMessagesSnapshot;
  }

  /** An array that only gets a new identity when the map items actually changed - see
   * useTeamMapItems() below. */
  public static get MapItemsSnapshot(): TeamMapItemsContext {
    return this.getInstance().mMapItemsSnapshot;
  }

  public static SubscribeHeader(listener: ChangeListener): () => void {
    return this.getInstance().subscribe('header', listener);
  }
  public static SubscribeMembers(listener: ChangeListener): () => void {
    return this.getInstance().subscribe('members', listener);
  }
  public static SubscribeMapItems(listener: ChangeListener): () => void {
    return this.getInstance().subscribe('mapItems', listener);
  }
  public static SubscribeMessages(listener: ChangeListener): () => void {
    return this.getInstance().subscribe('messages', listener);
  }

  private constructor() {
    SubscribeIsAppActive(this.handleAppStateChange.bind(this));
  }

  private startTeam(teamId: number): void {
    if (teamId === this.mCurrentTeamId) {
      console.log(`TeamContextService::startTeam teamId [${teamId}] already current - no-op`);
      return;
    }
    console.log(`TeamContextService::startTeam switching from [${this.mCurrentTeamId}] to [${teamId}]`);
    this.stopPolling();
    //this.mCurrentTeamId = teamId;
    //this.resetState();
    void this.loadFull(teamId);
  }

  private createEmptyTeamContext(): void {
    this.mContext = { LastHeaderUpdate: 0, LastMembersUpdate: 0, LastMessagesUpdate: 0, LastMapItemsUpdate : 0 } as TeamContext;
    this.mHeaderSnapshot = buildHeaderSnapshot(this.mContext);
    this.mMembersSnapshot = buildMembersSnapshot(this.mContext);
    this.mMessagesSnapshot = buildMessagesSnapshot(this.mContext);
    this.mMapItemsSnapshot = buildMapItemsSnapshot(this.mContext);
  }
  private resetState(): void {
    this.notify('header');
    this.notify('members');
    this.notify('mapItems');
    this.notify('messages');
  }

  /** The team is gone (410) or we're no longer an active member of it (403) - there is
   * nothing left to poll for, so stop entirely rather than keep hitting the same error. */
  private stopTeamNotFound(): void {
    console.warn(`TeamContextService::stopTeamNotFound team [${this.mCurrentTeamId}] gone/forbidden - stopping`);
    this.stopPolling();
    this.mCurrentTeamId = undefined;
    this.resetState();
    //Got to team selection page
  }

  private handleAppStateChange(isAppActive: boolean): void {
    console.log(`TeamContextService::handleAppStateChange isAppActive [${isAppActive}] currentTeamId [${this.mCurrentTeamId}]`);
    if (isAppActive) {
      if (this.mCurrentTeamId !== undefined && this.mPollTimer === null) {
        // Catch up immediately instead of waiting out the interval - team state (member
        // locations especially) is likely stale after being backgrounded.
        void this.pollDelta();
        this.startPolling();
      }
    } else {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.mPollTimer !== null || this.mCurrentTeamId === undefined) return;
    this.mPollTimer = setInterval(() => void this.pollDelta(), APP_CONFIG.TeamContextUpdatePeriodMs);
  }

  private stopPolling(): void {
    if (this.mPollTimer !== null) {
      clearInterval(this.mPollTimer);
      this.mPollTimer = null;
    }
  }

  private async loadFull(teamId:number): Promise<void> {
    const result = await this.request(`${APP_URLS.BASE_TEAM_URL}/${teamId}/context`);
    if (result.status === 200 && result.body) {
      this.createEmptyTeamContext();
      this.applyDelta(result.body as TeamContextDelta);
      if (GetIsAppActive()) this.startPolling();
    }
    else {
      this.stopTeamNotFound();
    }
    
  }

  private async pollDelta(): Promise<void> {
    const teamId = this.mCurrentTeamId;
    if (teamId === undefined) return;
    const since = this.mContext.LastCheckForUpdate;
    let url = `${APP_URLS.BASE_TEAM_URL}/${teamId}/context/delta?latestUpdateDate=${since}`;
    if (this.mContext.UnknownUserIds?.size) url += `&requestedUserIds=${Array.from(this.mContext.UnknownUserIds.values()).join(',')}`;
    const result = await this.request(url);
    if (teamId !== this.mCurrentTeamId) return; // team switched again while this was in flight

    if (result.status === 410 || result.status === 403) {
      this.stopTeamNotFound();
      return;
    }
    if (result.status === 200 && result.body) {
      this.applyDelta(result.body as TeamContextDelta);
    }
    // 204 = nothing changed since `since` - nothing to apply.
  }

  private applyDelta(delta: TeamContextDelta): void {
    const changed = applyTeamContextDelta(this.mContext, delta);
    if (changed.header) {
      this.mHeaderSnapshot = buildHeaderSnapshot(this.mContext);
      this.notify('header');
    }
    if (changed.members) {
      this.mMembersSnapshot = buildMembersSnapshot(this.mContext);
      this.notify('members');
    }
    if (changed.mapItems) {
      this.mMapItemsSnapshot =  buildMapItemsSnapshot(this.mContext);
      this.notify('mapItems');
    }
    if (changed.messages) {
      this.mMessagesSnapshot = buildMessagesSnapshot(this.mContext);
      this.notify('messages');
    }
  }

  private async request(url: string): Promise<{ status: number; body?: unknown }> {
    const attempt = () => fetch(url, { headers: { Authorization: `Bearer ${AuthToken.get() ?? ''}` } });
    try {
      let response = await attempt();
      if (response.status === 401) {
        // Shares apiSlice's single-flight refresh latch, same as MediaUploadService, so a
        // concurrent RTK Query request hitting 401 at the same time doesn't trigger a
        // second refresh that invalidates this one's cookie.
        const refreshed = await refreshAccessToken(createStandaloneRefreshApi('teamContext'), {});
        if (!refreshed) {
          notifyAuthLost();
          return { status: 401 };
        }
        response = await attempt();
        if (response.status === 401) notifyAuthLost();
      }
      if (response.status === 204 || !response.ok) {
        return { status: response.status };
      }
      const body = await response.json();
      return { status: response.status, body };
    } catch (err) {
      console.error(`TeamContextService::request [${url}] failed`, err);
      return { status: 0 };
    }
  }

  private subscribe(group: Group, listener: ChangeListener): () => void {
    this.mListeners[group].add(listener);
    return () => this.mListeners[group].delete(listener);
  }

  private notify(group: Group): void {
    this.mListeners[group].forEach((listener) => listener());
  }

  private mCurrentTeamId?: number;
  private mContext:TeamContext = {} as TeamContext;
  private mHeaderSnapshot: TeamHeaderContext = buildHeaderSnapshot(this.mContext);
  private mMembersSnapshot: TeamMembersContext = buildMembersSnapshot(this.mContext);
  private mMessagesSnapshot: TeamMessagesContext = buildMessagesSnapshot(this.mContext);
  private mMapItemsSnapshot: TeamMapItemsContext = buildMapItemsSnapshot(this.mContext);

  private mPollTimer: ReturnType<typeof setInterval> | null = null;
  private mListeners: Record<Group, Set<ChangeListener>> = {
    header: new Set(),
    members: new Set(),
    mapItems: new Set(),
    messages: new Set(),
  };

  private static getInstance(): TeamContextService {
    if (!this._instance) {
      console.log('TeamContextService::getInstance Create TeamContextService');
      this._instance = new TeamContextService();
    }
    return this._instance;
  }

  private static _instance?: TeamContextService;
}

/** Fires on first load of a (changed) team, and again whenever a context delta updates
 * TeamHeader, TeamDetails, or TeamUploadedMedias. Data: the header fields as of the last
 * such change (see HeaderSnapshot's own doc comment for why it isn't always fully live). */
export function useTeamHeader(): TeamHeaderContext {
  return useSyncExternalStore(
    (onChange) => TeamContextService.SubscribeHeader(onChange),
    () => TeamContextService.HeaderSnapshot
  );
}

/** Fires on first load of a (changed) team, and again whenever a context delta updates
 * Members, Users, RemoveMemberUserIds, or TeamPrimaryTargetUser. Data: the members fields
 * as of the last such change. */
export function useTeamMembers(): TeamMembersContext {
  return useSyncExternalStore(
    (onChange) => TeamContextService.SubscribeMembers(onChange),
    () => TeamContextService.MembersSnapshot
  );
}

/** Fires on first load of a (changed) team, and again whenever a context delta updates
 * GpsDeviceMapStates, RemoveMobileGpsDeviceIds, MobileGpsDevices, UserAlerts,
 * RemoveUserAlertIds, TeamPrimaryTargetUser, RemoveMemberUserIds, Members, or Users in a
 * way that touches a map pin. Data: the current TeamMapItem list. */
export function useTeamMapItems(): TeamMapItemsContext   {
  return useSyncExternalStore(
    (onChange) => TeamContextService.SubscribeMapItems(onChange),
    () => TeamContextService.MapItemsSnapshot
  );
}

/** Fires on first load of a (changed) team, and again whenever a context delta updates
 * UserMessages, RemoveUserMessageIds, or TeamActivities. Data: the messages fields as of
 * the last such change. */
export function useTeamMessages(): TeamMessagesContext {
  return useSyncExternalStore(
    (onChange) => TeamContextService.SubscribeMessages(onChange),
    () => TeamContextService.MessagesSnapshot
  );
}
