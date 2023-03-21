import axios, { AxiosProgressEvent } from "axios";

export async function uploadFile(
  url: string,
  file: File,
  onUploadProgress?: (e: AxiosProgressEvent) => void
) {
  const response = await axios.request({
    url,
    method: "PUT",
    data: file,
    onUploadProgress,
  });

  if (response.status !== 200) {
    throw new Error("Failed to upload file");
  }
}
