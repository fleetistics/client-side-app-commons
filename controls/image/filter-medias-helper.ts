import type { UploadedMediaDto } from "@/app.Commons/dataLayer/model/uploadedMediaDto";

const DELETED_MARKER = '**Deleted**';

export class FilterMediaHelper {
    static HasMediaByGroup(medias?: UploadedMediaDto[], groupKey?: number): boolean {
        if (!medias) return false;
        else {
            for (let i = 0, len = medias.length; i < len; i++) {
                let e = medias[i];
                if (e.PreviewUrl !== DELETED_MARKER) {
                    if (!groupKey && !e.GroupKey) return true;
                    else if (groupKey && groupKey == e.GroupKey) return true;
                }
            }
            return false;
        }
    }
    static FilterMediaByGroup(medias?: UploadedMediaDto[], groupKey?: number): UploadedMediaDto[] | undefined {
        if (!medias) return undefined;
        else {
            let res = medias.filter((e: UploadedMediaDto) => {
                if (e.PreviewUrl === DELETED_MARKER) return false;
                else if (!groupKey && !e.GroupKey) return e;
                else if (groupKey && groupKey == e.GroupKey) {
                    return e;
                }
                else return false;
            });
            if (res.length == 0) return undefined;
            else return res;
        }
    }
    // Existing (server-known) media is soft-removed by marking PreviewUrl so
    // form-helper.ts can still pick up its Id for RemoveMediaIds on submit.
    // Media never saved to the server (no Id yet) is dropped outright.
    static RemoveSingleMedia(item: UploadedMediaDto, medias?: UploadedMediaDto[]): UploadedMediaDto[] | undefined {
        if (!medias) return undefined;
        else {
            let res = medias.reduce<UploadedMediaDto[]>((acc, e) => {
                const isMatch = item.Id ? item.Id == e.Id : item.Url == e.Url;
                if (!isMatch) acc.push(e);
                else if (e.Id) acc.push({ ...e, PreviewUrl: DELETED_MARKER });
                return acc;
            }, []);
            if (res.length == 0) return undefined;
            else return res;
        }
    }
    static RemoveAllGroupMedia(medias?: UploadedMediaDto[], groupKey?: number): UploadedMediaDto[] | undefined {
        if (!medias) return undefined;
        else {
            let res = medias.reduce<UploadedMediaDto[]>((acc, e) => {
                const inGroup = groupKey ? e.GroupKey == groupKey : !e.GroupKey;
                if (e.PreviewUrl === DELETED_MARKER || !inGroup) acc.push(e);
                else if (e.Id) acc.push({ ...e, PreviewUrl: DELETED_MARKER });
                return acc;
            }, []);
            if (res.length == 0) return undefined;
            else return res;
        }
    }
}
