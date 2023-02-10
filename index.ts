import { createReadStream, createWriteStream } from "fs";
import { chain } from "stream-chain";
import { pick } from 'stream-json/filters/Pick';
import { parser } from "stream-json";
import { streamObject } from 'stream-json/streamers/StreamObject';
import makeCsvWriteStream from "csv-write-stream";

const inputFileName = "./inputs/node-roadmap.json";
const outputFileNameCSV = () => `./outputs/${Date.now()}-node-map.csv`;

chain([
    createReadStream(inputFileName),
    parser(),
    pick({filter: "mockup"}),
    streamObject(),
    (data) => {
        if (data.key === "controls") {
            return data.value
        }
        return null
    },
    (data) => {
        return data.control
    },
    (data) => {
        if (data.typeID !== "__group__" || data.properties === undefined) {
            return null;
        }
        return data;
    },
    (data) => {
        if (!data.properties.controlName) {
            return null
        }
        return data
    },
    (data) => {
        if ((data.properties.controlName as string).startsWith('ext_link')) {
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
            .map((item: any) => item.properties?.text.replace(/{color[:a-z]*}/g, ''));
        return result;
    },
    (data) => {
        return data.children.map((child: any) => ({type: data.name, name: child}))
    },
    // (data) => {
    //     console.log(data)
    //     return data;
    // },
    makeCsvWriteStream(),
    createWriteStream(outputFileNameCSV())
])