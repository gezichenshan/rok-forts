
// 遇到adb devices找不到设备时，先kill掉server再重启
// /Users/super/yjd/platform-tools/adb kill-server
// /Users/super/yjd/platform-tools/adb start-server
// ./src/mumutool port
// /Users/super/yjd/platform-tools/adb connect 127.0.0.1:16417
import fs from "fs";
import dayjs from "dayjs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from 'url';
import { Client as AdbClient, Device } from "adb-ts";
import { spawn } from "child_process";
import { setTimeout } from "node:timers/promises";
import * as db from './db'
import { getPixelmatchResult } from '../src/pixelmatch'
import { addFort } from "./services/api";
import { NETWORK_ERR_BTN, FORT_KEY_STRINGS } from '../src/constant'
import { Record } from './model'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const adb = new AdbClient({
  // bin: "C:\\Users\\admin\\Desktop\\JD\\title-script\\platform-tools\\adb.exe",
  bin: "/Users/super/yjd/platform-tools",
  host: "127.0.0.1",
  port: 5037,
});
const kindomDeviceTransportIdMap = {
  '544': '3',
}

const devices = await adb.map((device) => device);

console.log(devices)
const cropPosition = {
  left: 511,
  top: 188,
  width: 622,
  height: 54
}


function parse() {
  let firstUnhandled = db.getFirstUnhandledData()
  if (!firstUnhandled) return

  const screenshotPath = path.join(__dirname, './records/', firstUnhandled.src)
  const testImgPath = path.join(__dirname, './pixelmatch/images/20241116-1426755.png')
  const ls = spawn(
    'shortcuts',
    ['run', 'ocr-text', '-i', screenshotPath]
  );
  // control 0 --action run_cmd --cmd "input tap 195 19"
  console.log(`parse text from ${screenshotPath}`)
  ls.stdout.on("data", (data: string) => {
    console.log(`stdout: ${data}`);
    if (data && FORT_KEY_STRINGS.some(keyStr => data.includes(keyStr))) {
      addFort({ content: `${data}`, created_at: firstUnhandled.created_at }).catch(err => {
        console.log(err)
      }).finally(() => {
      })
    }
    db.setDataHandled(firstUnhandled)
  });
  ls.stderr.on("data", (data) => {
    console.error(`stderr: ${data} ${screenshotPath}`);
    db.setDataHandled(firstUnhandled)
    // ls.kill('SIGHUP')
  });
  ls.on("close", (code) => {
    console.log(`child process exited with code ${code} `);
  });
}

//有时候会有联盟技能等弹窗遮挡，点击其他区域消除弹窗。
async function clearOtherArea(device: Device) {
  await device.shell(`input tap 1590 450`); //点击其他位置，避免下面的事件不生效
}

async function clearNetworkErr(device: Device) {
  await device.shell(`input tap ${NETWORK_ERR_BTN}`);
}


let prevImgBuffer: Buffer
let currentImgBuffer: Buffer

async function record() {
  const device = devices.find(d => d.transportId === kindomDeviceTransportIdMap['544'])
  // console.log(device)
  clearOtherArea(device!)
  clearNetworkErr(device!)
  const screenshotBuffer = await device!.screenshot();


  sharp(screenshotBuffer)
    .extract(cropPosition)
    .ensureAlpha()
    .raw()
    .toBuffer().then(buffer => {
      let currentImgBuffer = buffer
      if (prevImgBuffer) {
        const numDiffPixels = getPixelmatchResult(prevImgBuffer, currentImgBuffer)
        console.log('numDiffPixels:', numDiffPixels)
        if (numDiffPixels > 200) {

          const screenshotName = `${dayjs().format('YYYYMMDD-HHmmSSS')}.png`
          const screenshotPath = path.join(__dirname, './records/', screenshotName)
          sharp(screenshotBuffer)
            .extract(cropPosition)
            .toFile(screenshotPath, function (err) {
              //save screenshot file and save meta data to db
              db.saveData(screenshotName)
            });
          console.log(currentImgBuffer)
        }
      }
      prevImgBuffer = currentImgBuffer
    })
}

async function startRecord() {
  while (true) {
    record();
    await setTimeout(1500);
  }
}

async function startParsetxt() {
  while (true) {
    parse();
    await setTimeout(5000);
  }
}


startRecord()
startParsetxt()