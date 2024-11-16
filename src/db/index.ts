import { unlink } from 'node:fs'
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

interface Record {
    src: string
    handled: boolean
}
type Data = {
    records: Record[];
};
const defaultData = { records: [] };

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const adapter = new JSONFile<Data>(file);
const db = new Low(adapter, defaultData);

await db.read();

export async function saveData(src: string) {
    db.data.records.push({
        src,
        handled: false,
    });
    await db.write();
}

export function getFirstUnhandledData() {
    const unhandled = db.data.records.find(
        (v) => !v.handled
    );
    return unhandled;
}

export function setDataHandled(r: Record) {
    const _data = db.data.records.find((loc) => loc.src === r.src);
    if (_data) {
        _data.handled = true;
        db.write();
        // removeHandledImage(r.src)
    }
}

function removeHandledImage(src: string) {
    const screenshotPath = join(__dirname, '../records/', src)
    unlink(screenshotPath, (err) => {
        if (err) {
            console.error(`Error removing file ${err}`)
            return
        }
        console.log(`File ${src} been successfully removed!`)
    })
}