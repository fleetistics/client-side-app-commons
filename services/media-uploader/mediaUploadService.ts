import AsyncStorage from "@react-native-async-storage/async-storage";

import { uploadBinaryFile } from "./nativeUploadClient";
import { GetIsAppActive, SubscribeIsAppActive } from "../app-state-context";
import { StringUtils } from "@/client-side.Commons/helpers/string";
import { InboundUploadedMediaDto } from "@/app.Commons/dataLayer/model/uploadedMediaDto";
import { AuthToken, createStandaloneRefreshApi, notifyAuthLost, refreshAccessToken } from "@/client-side.Commons/dataLayer/apiSlice";
import { APP_URLS } from "@/app.Impl/configs/app-urls";




type UploadQueueItem = {
    guid: string,
    url: string,
    mediaType: number,
    failuresCnt: number,
    completionTime?: number
}

export class MediaUploadService {
    public static EnqueueSingleMedia(guid: string, url: string, mediaType:number ) {
        this.getInstance().enqueueSingleMedia(guid, url, mediaType);
    }

    public static Enqueue(medias: InboundUploadedMediaDto[]) {
        for (let i = 0, n = medias.length; i < n; i++) {
            this.getInstance().enqueueSingleMedia(medias[i].Guid ?? "", medias[i].Url ?? "", medias[i].MediaType ?? 0);
        }
    }

    public static Dequeue(guid: string) {
        this.getInstance().dequeue(guid);
    }
    public dequeue(guid: string) {
        let tmpIdx = this.mQueue.findIndex(e => e.guid === guid);
        if (tmpIdx > 0 || (tmpIdx === 0 && !this.mIsProcessing)) {
            this.mQueue.splice(tmpIdx, 1);
        }
    }

    private handleAppStateChange(isAppActive: boolean) {
        console.log(`MediaUploadService handleAppStateChange isAppActive [${isAppActive}] latestAppState [${this.mLatestAppStateActive}] this.mIsUploadingStopped ${this.mIsUploadingStopped}`);
        if (this.mLatestAppStateActive != isAppActive) {
            if (!isAppActive) {
                this.mIsUploadingStopped = true;
                if (this.mRestarTimer != null) {
                    clearTimeout(this.mRestarTimer);
                    this.mRestarTimer = null;
                }
            }
            else if (isAppActive && this.mIsUploadingStopped && this.mRestarTimer == null) {
                this.mRestarTimer = setTimeout(() => {
                    this.mRestarTimer = null;
                    if (GetIsAppActive() && this.mIsUploadingStopped) {
                        this.mIsUploadingStopped = false;
                        this.processQueue();
                    }
                }, 10000);

            }
            this.mLatestAppStateActive = isAppActive;
        }
    }
    private constructor() {
        //onsole.log("MediaUploadService::constructor");
        SubscribeIsAppActive(this.handleAppStateChange.bind(this));
        AsyncStorage.getItem('MediaUploadService.mQueue').then((value) => {
            console.log("MediaUploadService::loadFromStorage this.mQueue", value);
            if (!StringUtils.isEmpty(value)) {
                this.mQueue = JSON.parse(value ?? "") as UploadQueueItem[];
                //console.log(`loadFromStorage this.mQueue size ${this.mQueue.length}`);
                if (this.mQueue.length > 0) {
                    this.mRestarTimer = setTimeout(() => {
                        if (GetIsAppActive() && !this.mIsProcessing) {
                            //console.log("MediaUploadService constructor  Upload restarted");
                            this.processQueue();
                        }
                    }, 10000);
                }
            }
        })
        .catch((err) => {
            console.error('MediaUploadService::loadFromStorage AsyncStorage mTasks failed', err);
        });
    }

    private saveToStorage() {
        console.log(`MediaUploadService::saveToStorage mQueue ${this.mQueue.length}`);

        AsyncStorage.setItem('MediaUploadService.mQueue', JSON.stringify(this.mQueue))
            .then(() => {
                //console.log("saveToStorage this.mQueue", JSON.stringify(this.mQueue));
            })
            .catch((err) => {
                console.error('MediaUploadService::saveToStorage AsyncStorage mQueue failed', err);
            });
    }

    private processQueue() {
        if (this.mIsUploadingStopped || this.mIsProcessing || this.mQueue.length === 0) {
            console.log(`MediaUploadService::processQueue mIsUploadingStopped ${this.mIsUploadingStopped} mIsProcessing ${this.mIsProcessing} mQueue.length ${this.mQueue.length} EMPTY`)
            return;
        }
        this.mIsProcessing = true;
        if (this.mReuploadTimer) {
            clearTimeout(this.mReuploadTimer);
            this.mReuploadTimer = null;
        }

        const uploadedItem = this.mQueue[0];

  
        const headers: Record<string, string> = {
            "Idempotency-Key": uploadedItem.guid,
        };
        const formFields: Record<string, string> = {
            Guid: uploadedItem.guid,
            MediaType: uploadedItem.mediaType.toString(),
        };
        //let fileUrl = uploadedItem.url;
        // const dotIdx = fileUrl.lastIndexOf('.');
        // //console.log(`processQueue fileUrl [${fileUrl}] dotIdx [${dotIdx}] delta ${fileUrl.length - dotIdx}`);
        // if (dotIdx > -1 && (fileUrl.length - dotIdx) < 6) {
        //     const fileExtension = fileUrl.substring(dotIdx + 1);
        //     if (!fileExtension.includes('\\') && !fileExtension.includes('/')) headers.fileExtension = fileExtension;
        // }
        const onProgress = (size: number, total: number) => {
            // if (task) {
            //     const prevSize = task.state.itemUploaded;
            //     size = Math.min(size, uploadedItem.size);
            //     task.state.itemUploaded = size;
            //     task.state.totalUploaded += (size - prevSize);
            //     this.updateTaskListener(task);
            // }
        }

        const processError = (error: string) => {
            console.error(`processQueue processError [${error}]`)

            this.mIsProcessing = false;
            const normalizedError = (error ?? "").toLowerCase();
            const isFileNotFound = normalizedError.includes(" doesn't exist")
                || normalizedError.includes("no such file")
                || normalizedError.includes("file doesn't exist")
                || normalizedError.includes("cannot be read");
            if (isFileNotFound) {
                console.error(`processQueue processError [${error}] isFileNotFound - removed ${uploadedItem.failuresCnt}`);
                //if (task) task.state.status = MediaUploadStatus.FileNotFound;
                this.mQueue.splice(0, 1);
                this.saveToStorage();
                this.processQueue();
            }
            else {
                if (++uploadedItem.failuresCnt > 3) {
                    if (this.mQueue.length > 1) {
                        console.error(`processQueue processError [${error}] Move to end of queue ${uploadedItem.failuresCnt}`);
                        const [removedItem] = this.mQueue.splice(0, 1);
                        this.mQueue.push(removedItem);
                    }

                    if (uploadedItem.failuresCnt > 4) {
                        console.error(`processQueue processError wait 60s and retry [${error}] `);
                        this.mReuploadTimer = setTimeout(() => {
                            this.processQueue();
                        }, 60000);
                    }
                    else {
                        console.error(`processQueue processError try next `);
                        this.processQueue();
                    }
                }
                else {
                    console.error(`processQueue processError [${error}] failed - Retried ${uploadedItem.failuresCnt}`);
                    this.processQueue();
                }
            }
        }


        console.log(`MediaUploadService::processQueue Upload apiUrl [${APP_URLS.UPLOAD_URL}] ` + uploadedItem.url + ` guid [${uploadedItem.guid}] mediaType [${uploadedItem.mediaType}] failuresCnt [${uploadedItem.failuresCnt}]`);

        const attemptUpload = () =>
            uploadBinaryFile(
                APP_URLS.UPLOAD_URL,
                uploadedItem.url,
                { ...headers, Authorization: `Bearer ${AuthToken.get() ?? ""}` },
                formFields,
                onProgress
            );

        attemptUpload()
            .then(async result => {
                if (result.status === 401) {
                    // Share apiSlice's single-flight refresh latch so a concurrent RTK Query
                    // request hitting 401 at the same time doesn't trigger a second refresh
                    // that invalidates this one's cookie.
                    const refreshed = await refreshAccessToken(createStandaloneRefreshApi('mediaUpload'), {});
                    if (!refreshed) {
                        notifyAuthLost();
                        processError("MediaUploadService::processQueue-uploadBinaryFile Server Error 401");
                        return;
                    }
                    result = await attemptUpload();
                    if (result.status === 401) notifyAuthLost();
                }

                //console.log("processQueue Uploaded ", result);
                let wasMediaNotFound = false;
                if (result.status == 500 && result.body && typeof result.body === "string") {
                    try {
                        let parsedBody = JSON.parse(result.body);
                        if (parsedBody.message && typeof parsedBody.message === "string" && parsedBody.message.startsWith("Media was not found mediaId")) wasMediaNotFound = true;
                    }
                    catch (err) {
                    }
                }
                if (result.status == 200 || wasMediaNotFound) {
                    this.mQueue.splice(0, 1);
                    this.saveToStorage();

                    this.mIsProcessing = false;

                    this.processQueue();
                }
                else {
                    processError("MediaUploadService::processQueue-uploadBinaryFile Server Error " + result.status);
                }
            })
            .catch(err => {
                console.error(`MediaUploadService::processQueue uploadBinaryFile catch(err [${err}]`);
                processError(err);
            });
    }

    private enqueueSingleMedia(guid: string, url: string, mediaType:number) {
        console.log(`MediaUploadService::enqueueSingleMedia guid: ${guid}, url: ${url}, mediaType: ${mediaType}`);
        if ( this.mQueue.findIndex(e => e.guid === guid) >= 0) {
            console.log(`MediaUploadService::enqueueSingleMedia guid: ${guid} already in queue ${this.mQueue.length} items`);
            return;
        }
        this.mQueue.push({ url: url, guid: guid, mediaType: mediaType, failuresCnt: 0 });
        console.log(`MediaUploadService::enqueueSingleMedia enqueued, ${this.mQueue.length} items`, this.mQueue);
        this.saveToStorage();
        this.processQueue();
    }


    private mIsUploadingStopped: boolean = false;
    private mQueue: UploadQueueItem[] = [];
    private mIsProcessing: boolean = false;
    private mLatestAppStateActive: boolean = true;
    private mReuploadTimer: ReturnType<typeof setTimeout> | null = null;
    private mRestarTimer: ReturnType<typeof setTimeout> | null = null;


    public static Create(): void {
        console.log('MediaUploadService::Create');
        this.getInstance();
    }


    private static getInstance(): MediaUploadService {
        if (!this._instance) {
            console.log('MediaUploadService::getInstance Create MediaUploadService');
            this._instance = new MediaUploadService();
        }
        return this._instance;
    }

    private static _instance?: MediaUploadService;

}