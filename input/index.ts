import axios from "axios";
import { createReadStream, ReadStream } from "fs";

export const getInputStream = async () => {
  if (!process.env.INPUT_URL || !process.env.INPUT_FILE_NAME) {
    throw new Error("MISSING INPUT ENV");
  }

  if (process.env.INPUT_URL) {
    const inputUrl = process.env.INPUT_URL;

    const response = await axios.get(inputUrl, {
      responseType: "stream",
    });

    return response.data as ReadStream;
  }

  const inputFilePath: string = process.env.INPUT_FILE_NAME;

  return createReadStream(inputFilePath);
};
