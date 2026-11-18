// Decodes a Blob and encodes a JPEG through a canvas.
// Source: https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob

export async function resizeImage(
  source: Blob,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode the image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}
