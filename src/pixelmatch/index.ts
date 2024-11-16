import pixelmatch from 'pixelmatch'


export function getPixelmatchResult(img1: Buffer, img2: Buffer) {
    const numDiffPixels = pixelmatch(img1, img2, null, 622, 54, { threshold: 0.1 });
    return numDiffPixels
}

