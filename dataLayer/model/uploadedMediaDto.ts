import type { components } from '@/app.DataLayer/apiSchema';
import type { Concrete } from '@/client-side.Commons/dataLayer/apiTypes';

export enum MediaType {
    Image = 1,
    Video = 2,
    Sound = 3,
    File = 4
}

type UploadedMediaDtoSchema = components['schemas']['UploadedMediaDto'];

// Always populated for a media item returned by the server.
export type UploadedMediaDto = Concrete<UploadedMediaDtoSchema, 'Id' | 'Guid' | 'Url' | 'MediaType'| 'PreviewUrl'| 'GroupKey'>;

type InboundUploadedMediaDtoSchema = components['schemas']['InboundUploadedMediaDto'];

// Always required when the client sends a new media item to the server.
export type InboundUploadedMediaDto = Concrete<InboundUploadedMediaDtoSchema, 'Guid' | 'Url' | 'MediaType'| 'GroupKey'>;
