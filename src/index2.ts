
// 遇到adb devices找不到设备时，先kill掉server再重启
// /Users/super/yjd/platform-tools/adb kill-server
// /Users/super/yjd/platform-tools/adb start-server
// ./src/mumutool port
// /Users/super/yjd/platform-tools/adb connect 127.0.0.1:21000
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from 'url';
import { Client as AdbClient, Device } from "adb-ts";
import { spawn } from "child_process";
import { setTimeout } from "node:timers/promises";
import { addFort } from "./services/api";
import { NETWORK_ERR_BTN } from '../src/constant'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotPath = path.join(__dirname, './screenshots/', 'record.png')


const adb = new AdbClient({
  // bin: "C:\\Users\\admin\\Desktop\\JD\\title-script\\platform-tools\\adb.exe",
  bin: "/Users/super/yjd/platform-tools",
  host: "127.0.0.1",
  port: 5037,
});
const kindomDeviceTransportIdMap = {
  '544': '2',
}

const devices = await adb.map((device) => device);

console.log(devices)
const cropPosition = {
  left: 511,
  top: 188,
  width: 622,
  height: 54
}

function getTextFromImage() {
  const ls = spawn(
    'shortcuts',
    ['run', 'ocr-text', '-i', screenshotPath]
  );
  // control 0 --action run_cmd --cmd "input tap 195 19"
  ls.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    if (data) {
      addFort({ content: `${data}` }).catch(err => {
        console.log(err)
      })
    }
  });
  ls.stderr.on("data", (data) => {
    console.error(`stderr: ${data} `);
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


async function main() {
  const device = devices.find(d => d.transportId === kindomDeviceTransportIdMap['544'])
  // console.log(device)
  clearOtherArea(device!)
  clearNetworkErr(device!)
  const screenshotBuffer = await device!.screenshot();
  // fs.writeFileSync(screenshotPath, screenshotBuffer)
  sharp(screenshotBuffer)
    .extract(cropPosition)
    .toFile(screenshotPath, function (err) {
      // Extract a region of the input image, saving in the same format.
      getTextFromImage()
    });
}
while (true) {
  main();
  await setTimeout(1500);
}
