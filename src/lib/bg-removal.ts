import axios from "axios";
import FormData from "form-data";
import { readFile } from "node:fs/promises";

export async function removeBackgroundApi(file: File) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error("REMOVE_BG_API_KEY is not configured on the server");
  }

  // Convert File (which is a Blob in Node/Browser) to a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const formData = new FormData();
  formData.append("image_file", buffer, file.name);
  formData.append("size", "auto");

  try {
    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": apiKey,
      },
      responseType: "arraybuffer",
    });

    return new Blob([response.data], { type: "image/png" });
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}
