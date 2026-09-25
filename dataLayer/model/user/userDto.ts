import type {
  UserDto as UserDtoSchema,
  UserPatchDto,
  UserLocationPrivacyDto as UserLocationPrivacyDtoSchema,
  UserLocationPrivacyPatchDto,
} from '@/app.Commons/dataLayer/open-api';
import type { Concrete } from '@/client-side.Commons/dataLayer/core/apiTypes';

// UserController always populates these for an existing user.
// Medias is handled separately from Concrete<>: the schema's own array item
// type leaves every field optional/nullable, so narrowing just the array
// wouldn't narrow its items — UploadedMediaDto (see uploadedMediaDto.ts) does
// that narrowing already, so we swap it in directly.
export type User = Concrete<
  UserDtoSchema,
  'Id' | 'DisplayName' | 'UserName' | 'FullName' | 'Phone' | 'Email' | 'AvatarImage' | 'GovIDImage'>;

// export type NewUser = Concrete<
//   UserDtoSchema,
//   'UserName' | 'DisplayName' | 'FullName' | 'Phone' | 'Email'
// >;

// Unlike UserDtoSchema, this one doesn't need Concrete<>'s null-narrowing — the
// server's Optional<T> schema transformer faithfully encodes each field's real
// nullability (see UserPatchDto.cs / OptionalPropertySchemaTransformer.cs), so
// the generated type is already accurate. InsertMedias is the exception: its
// schema item type leaves every field optional, so we swap in the already-
// narrowed InboundUploadedMediaDto (see uploadedMediaDto.ts) instead.
export type UserPatch = Pick<
  UserPatchDto,
  'DisplayName' | 'FullName' | 'Phone' | 'Email' | 'RemoveMediaIds' | 'InsertMedias'
>;

// UserController returns 200 with both fields populated when a record exists, and 404
// (not 200-with-empty-body) when the current user has none yet — see userApi.ts's
// getUserLocationPrivacy, which turns that 404 into a `null` result rather than an error.
export type UserLocationPrivacyDto = Concrete<
  UserLocationPrivacyDtoSchema,
  'PrivacyMode' | 'LatestUpdate'
>;

// The only field this PATCH accepts, so unlike UserPatch's partial-update fields, there's
// no reason to leave it optional — every call is setting it.
export type UserLocationPrivacyPatch = {
  PrivacyMode: NonNullable<UserLocationPrivacyPatchDto['PrivacyMode']>;
};
