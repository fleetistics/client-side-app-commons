import * as React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Camera, ImagePlus, Trash2, Video } from '@/components/ui/icons';
import { Button } from '@/app.Commons/components/controls/button';
import { Label } from '@/app.Commons/components/controls/label';
import { FilterMediaHelper } from '@/app.Commons/components/image/filter-medias-helper';
import { OpenGallery, OpenPhoto, OpenVideo } from '@/app.Commons/components/image/media-selector-helper';
import { ViewUploadedMedias } from '@/app.Commons/components/image/viewUploadedMedias';
import type { UploadedMediaDto } from '@/app.Commons/dataLayer/model/uploadedMediaDto';
import { MediaUploadService } from '@/app.Commons/services/media-uploader/mediaUploadService';

export type MediaSelectorProps<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  groupKey?: number;
  readOnly?: boolean;
  hideGallery?: boolean;
  hideVideo?: boolean;
  hidePhoto?: boolean;
  singleMode?: boolean;
};

export function MediaSelector<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  groupKey,
  readOnly,
  hideGallery,
  hideVideo,
  hidePhoto,
  singleMode,
}: MediaSelectorProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const values = value as UploadedMediaDto[] | undefined;
        const groupMedia = FilterMediaHelper.FilterMediaByGroup(values, groupKey);

        return (
          <View className="gap-1.5">
            {label && <Label nativeID={name}>{label}</Label>}

            {groupMedia && (
              <ViewUploadedMedias
                files={groupMedia}
                removeItem={
                  readOnly
                    ? undefined
                    : (item: UploadedMediaDto) => {
                        MediaUploadService.Dequeue(item.Guid);
                        onChange(FilterMediaHelper.RemoveSingleMedia(item, values));
                      }
                }
              />
            )}

            {!readOnly && (
              <View className="flex-row items-center gap-2">
                {groupMedia && (
                  <Button
                    variant="outline"
                    size="icon"
                    onPress={() => {
                      groupMedia?.forEach((item: UploadedMediaDto) => MediaUploadService.Dequeue(item.Guid));
                      onChange(FilterMediaHelper.RemoveAllGroupMedia(values, groupKey));
                    }}
                  >
                    <Trash2 className="text-destructive" size={18} />
                  </Button>
                )}
                {!hidePhoto && (
                  <Button
                    variant="outline"
                    size="icon"
                    onPress={() => OpenPhoto(onChange, values ?? [], singleMode ?? false, groupKey)}
                  >
                    <Camera className="text-foreground" size={18} />
                  </Button>
                )}
                {!hideVideo && (
                  <Button
                    variant="outline"
                    size="icon"
                    onPress={() => OpenVideo(onChange, values ?? [], singleMode ?? false, groupKey)}
                  >
                    <Video className="text-foreground" size={18} />
                  </Button>
                )}
                {!hideGallery && (
                  <Button
                    variant="outline"
                    size="icon"
                    onPress={() => OpenGallery(onChange, values ?? [], singleMode ?? false, groupKey)}
                  >
                    <ImagePlus className="text-foreground" size={18} />
                  </Button>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}
