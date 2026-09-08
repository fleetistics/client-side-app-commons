import ReactNativeBlobUtil from "react-native-blob-util";

export type UploadResponse = {
    status: number,
    headers: Record<string, string>,
    body: string
}

function stripFileScheme(fileUrl: string): string {
    if (fileUrl.startsWith("file://")) return fileUrl.substring(7);
    return fileUrl;
}

function inferMimeType(fileUrl: string): string {
    const cleanUrl = fileUrl.split("?")[0].split("#")[0];
    const fileName = (cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1) || "").toLowerCase();
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
    if (fileName.endsWith(".png")) return "image/png";
    if (fileName.endsWith(".webp")) return "image/webp";
    if (fileName.endsWith(".heic")) return "image/heic";
    if (fileName.endsWith(".gif")) return "image/gif";
    if (fileName.endsWith(".mp4")) return "video/mp4";
    if (fileName.endsWith(".mov")) return "video/quicktime";
    return "application/octet-stream";
}

export async function uploadBinaryFile(
    apiUrl: string,
    fileUrl: string,
    headers: Record<string, string>,
    formFields: Record<string, string>,
    onProgress?: (written: number, total: number) => void
): Promise<UploadResponse> {
    const filePath = stripFileScheme(fileUrl);
    //console.log(`uploadBinaryFile fileUrl [${fileUrl}] filePath [${filePath}]`);

    const exists = await ReactNativeBlobUtil.fs.exists(filePath);
    if (!exists) {
        console.error(`uploadBinaryFile doesn't exist fileUrl [${fileUrl}] filePath [${filePath}]`);
        throw new Error(`File doesn't exist: ${filePath}`);
    }

    const stat = await ReactNativeBlobUtil.fs.stat(filePath);
    const fileSize = stat.size;
    //console.log(`uploadBinaryFile file exists, size=${fileSize}`);

    // Body is an array of form-data parts, so react-native-blob-util sends this as
    // multipart/form-data and sets its own Content-Type (with boundary) automatically.
    const response = await ReactNativeBlobUtil.fetch(
        "POST",
        apiUrl,
        headers,
        [
            ...Object.entries(formFields).map(([name, data]) => ({ name, data })),
            {
                name: "file",
                filename: filePath.substring(filePath.lastIndexOf("/") + 1),
                type: inferMimeType(fileUrl),
                data: ReactNativeBlobUtil.wrap(filePath),
            },
        ]
    ).uploadProgress((written, total) => {
        if (onProgress) onProgress(written, total > 0 ? total : fileSize);
    });

    const status = response.respInfo.status;
    const respHeaders = response.respInfo.headers ?? {};
    const body = String(response.text() ?? "");
    //console.log(`uploadBinaryFile response status=${status}`);

    return { status, headers: respHeaders as Record<string, string>, body };
}