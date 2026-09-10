// Mirrors api-server's MyUserEmergencyAlertDto (GET /api/users/me/active-emergency-alert).
// Hand-typed rather than sourced from apiSchema.d.ts like userDto.ts/uploadedMediaDto.ts do,
// because the server endpoint is newer than the last `yarn generate:api` run - swap this for
// a Concrete<components['schemas']['MyUserEmergencyAlertDto'], ...> once the schema is
// regenerated, for the same server-rename-fails-typecheck safety the other DTOs get.
export type MyUserEmergencyAlertDto = {
  CreatedDate: string;
  Latitude?: number | null;
  Longitude?: number | null;
};
