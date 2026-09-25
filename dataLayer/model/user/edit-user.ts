import { EditorUploadedMedia } from "@/client-side.Commons/dataLayer/model/uploaded-media";
import { User } from "./userDto";

export type EditUser = User & {
    Medias:EditorUploadedMedia[]
}

export enum EditUserGroupKey {
    Avatar = 1,
    GovID = 2
}