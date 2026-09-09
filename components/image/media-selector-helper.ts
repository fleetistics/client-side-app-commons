import { Alert, Platform } from "react-native";
import ImagePicker, { ImageOrVideo, Image as PickerImage } from "react-native-image-crop-picker";
import { v4 as uuidv4 } from "uuid";

import { openSettings, PERMISSIONS, request, requestMultiple, RESULTS } from "react-native-permissions";
import { MediaType, UploadedMediaDto } from "@/app.Commons/dataLayer/model/uploadedMediaDto";
import { APP_CONFIG } from "@/app.Impl/configs/app-config";
import { MediaUploadService } from "@/app.Commons/services/media-uploader/mediaUploadService";




function mediaTypeParser(mimeType: string | undefined): MediaType {
    if (!mimeType) return MediaType.File; // error
    let mimeArray = mimeType.split("/");
    if (mimeArray.includes("image")) {
        return MediaType.Image;
    } else if (mimeArray.includes("video")) {

        return MediaType.Video;
    } else if (mimeArray.includes("sound")) {
        return MediaType.Sound;
    }

    console.warn(`Determining file type is unknown [${mimeType}]`);
    return MediaType.File;
}

export function OpenVideo(onChange: (event: any[]) => void, value: UploadedMediaDto[], singleMode: boolean = false, groupKey?: number) {
    selectMedia("video", onChange, value, singleMode, groupKey);
}
export function OpenPhoto(onChange: (event: any[]) => void, value: UploadedMediaDto[], singleMode: boolean = false, groupKey?: number) {
    selectMedia("photo", onChange, value, singleMode, groupKey);
}
export function OpenGallery(onChange: (event: any[]) => void, value: UploadedMediaDto[], singleMode: boolean = false, groupKey?: number) {
    selectMedia("gallery", onChange, value, singleMode, groupKey);
}
async function selectMedia(option: "photo" | "video" | "gallery", onChange: (event: any[]) => void, value: UploadedMediaDto[], singleMode: boolean = false, groupKey?: number) {
    const cropMediaResponseHandler = async (images: ImageOrVideo[], value: Array<UploadedMediaDto>, singleMode: boolean) => {
        //console.log('mediaResponseHandler step #1');

        //console.log('mediaResponseHandler step #2');
        let selectedUploadeMedias: UploadedMediaDto[] = [];

        for (const image of images) {
            //console.log('mediaResponseHandler image', image);
            console.log('mediaResponseHandler image modificationDate', image.modificationDate);

            // Prefer the picker temp file path because URI schemes like ph:// are not uploadable via fetch/xhr blob conversion.
            let url = image.path ? `${image.path}` : `${image.sourceURL ?? ""}`;
            if (!value || !value!.find(e => (e.Url == url))) {

                let newMedia = {
                    Guid: uuidv4(),
                    GroupKey: groupKey,
                    MediaType: mediaTypeParser(image.mime),
                    Url: url
                } as UploadedMediaDto;
                //if (image.modificationDate) {
                    //newMedia.creationDate = image.modificationDate.length >10?parseInt(image.modificationDate.substring(0,9)):parseInt(image.modificationDate);
                //}
                console.log('mediaResponseHandler newMedia', newMedia);
                selectedUploadeMedias.push(newMedia);
                if (APP_CONFIG.InstandMediaUpload) {
                    MediaUploadService.EnqueueSingleMedia(newMedia.Guid, newMedia.Url, newMedia.MediaType);
                }
                if (singleMode) break;
            }
        }
        //console.log('mediaResponseHandler step #3');
        if (selectedUploadeMedias.length > 0) {
            if (value && value.length > 0 && !singleMode) onChange([...value, ...selectedUploadeMedias]);
            else onChange(selectedUploadeMedias);
        }

    };
    if (option === "photo") {
        try {
            const cameraPermissionStatus = await request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA);
            if (cameraPermissionStatus !== RESULTS.GRANTED) {
                Alert.alert('Permissions Needed', 'Enable Camera access to attach photo', [
                    {
                        text: 'Go to Settings',
                        onPress: () => openSettings()
                    },
                    {
                        text: 'Close',
                        style: 'cancel'
                    },
                ]);
                return;
            }
            else {
                ImagePicker.openCamera({ mediaType: 'photo' }).then((image: PickerImage) => {
                    console.log('ImagePicker.openCamera', image);
                    cropMediaResponseHandler([image], value, singleMode);
                }).catch((e) => {
                    if (e != 'Error: User cancelled image selection') console.error(`ImagePicker: ${e}`);
                });

            }
        } catch (error) {
            console.error('Error requesting camera permission:', error);
        }
    } else if (option === "video") {
        console.log('video')
        try {
            const cameraPermissionStatus = await requestMultiple(Platform.OS === 'ios' ? [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE] : [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO]);
            if (
                (Platform.OS === 'ios' && (cameraPermissionStatus[PERMISSIONS.IOS.CAMERA] != RESULTS.GRANTED || cameraPermissionStatus[PERMISSIONS.IOS.MICROPHONE] != RESULTS.GRANTED))
                ||
                (Platform.OS !== 'ios' && (cameraPermissionStatus[PERMISSIONS.ANDROID.CAMERA] != RESULTS.GRANTED || cameraPermissionStatus[PERMISSIONS.ANDROID.RECORD_AUDIO] != RESULTS.GRANTED))
            ) {
                Alert.alert('Permissions Needed', 'Enable Camera/Microphone access to attach video', [
                    {
                        text: 'Go to Settings',
                        onPress: () => openSettings()
                    },
                    {
                        text: 'Close',
                        style: 'cancel'
                    },
                ]);
                return;
            }
            else {

                ImagePicker.openCamera({ mediaType: 'video' }).then((image: PickerImage) => {
                    cropMediaResponseHandler([image], value, singleMode);

                }).catch((e) => {
                    if (e != 'Error: User cancelled image selection') console.error(`ImagePicker: ${e}`);

                });
            }
        } catch (error) {
            console.error('Error requesting camera permission:', error);
        }
    } else {
        try {
            const cameraPermissionStatus = await request(Platform.OS === 'ios' ? PERMISSIONS.IOS.MEDIA_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
            if (cameraPermissionStatus !== RESULTS.GRANTED) {
                Alert.alert('Permissions Needed', 'Enable Media access to attach photo', [
                    {
                        text: 'Go to Settings',
                        onPress: () => openSettings()
                    },
                    {
                        text: 'Close',
                        style: 'cancel'
                    },
                ]);
                return;
            }
            else {
                if (!singleMode) {
                    ImagePicker.openPicker({
                        mediaType: 'photo', multiple: true
                    }).then((images: PickerImage[]) => {
                        cropMediaResponseHandler(images, value, singleMode);

                    }).catch((e) => {
                        if (e != 'Error: User cancelled image selection') console.error(`ImagePicker: ${e}`);

                    });
                } else {
                    ImagePicker.openPicker({
                        mediaType: 'photo', multiple: false
                    }).then((image: PickerImage) => {
                        cropMediaResponseHandler([image], value, singleMode);
                    }).catch((e) => {
                        if (e != 'Error: User cancelled image selection') console.error(`ImagePicker: ${e}`);

                    });
                }
            }
            } catch (error) {
                console.error('Error requesting camera permission:', error);
            }
        }
};