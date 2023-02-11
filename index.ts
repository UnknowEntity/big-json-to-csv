import { createReadStream, createWriteStream } from "fs";
import { chain } from "stream-chain";
import { pick } from 'stream-json/filters/Pick';
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import makeCsvWriteStream from "csv-write-stream";
import dotenv from "dotenv";

dotenv.config();

(function main() {
  if (!process.env.INPUT_FILE_NAME || !process.env.OUTPUT_FILE_NAME) {
    console.log("MISSING ENV DEFINE");
    return;
  }

  const inputFileName = `./inputs/${process.env.INPUT_FILE_NAME}.json`;
  const outputFileNameCSV = () =>
    `./outputs/${Date.now()}-${process.env.OUTPUT_FILE_NAME}.csv`;

  chain([
    createReadStream(inputFileName),
    parser(),
    pick({ filter: "mockup" }),
    pick({ filter: "controls" }),
    pick({ filter: "control" }),
    streamArray(),
    ({ value: data }) => {
      if (data.typeID !== "__group__" || data.properties === undefined) {
        return null;
      }

      if (!data.properties.controlName) {
        return null;
      }

      if ((data.properties.controlName as string).startsWith("ext_link")) {
        return null;
      }

      return data;
    },
    (data) => {
      const result = {
        name: (data.properties.controlName as string).slice(4),
        children: [],
      };
      result.children = data.children.controls.control
        .filter((item: any) => item.properties?.text)
        .map((item: any) =>
          item.properties?.text.replace(/{color[:a-z]*}/g, "")
        );
      return result;
    },
    (data) => {
      return data.children.map((child: any) => ({
        type: data.name,
        name: child,
      }));
    },
    //   (data) => {
    //     console.log(data);
    //     return data;
    //   },
    makeCsvWriteStream(),
    createWriteStream(outputFileNameCSV()),
  ]);
})();