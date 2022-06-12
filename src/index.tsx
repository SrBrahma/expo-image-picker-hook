import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


// Based on https://docs.expo.dev/versions/latest/sdk/imagepicker


/** https://stackoverflow.com/a/18650249
 * https://stackoverflow.com/a/33448478 */
function blobToBase64(blob: any): Promise<any> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}


export type UseImagePickerProps = Omit<ImagePicker.ImagePickerOptions, 'base64'> & {
  /** Error text that will be thrown if the user doesn't provide the permission to access the device media. */
  permissionNotGrantedText?: string;
};

type UploadImageOptions = {
  /** @default 'blob' */
  mode?: 'blob' | 'base64';
  /** Call reset() on successful upload. Useful for disabling upload button and cleaning a form's dirtiness.
   * @default true */
  resetImageOnSuccess?: boolean;
};

export type UseImagePickerReturn = {
  /** The URI of the selected image */
  imageUri: string | null;
  /** Same as `!!imageUri`, but prettier. */
  isPicked: boolean;

  /** Picks an image.
   *
   * You must try/catch this as it may throw errors like if user doesn't provide the permission.
   *
   * @throws */
  pick: (opts?: {
    /** If it shall immediatly upload after picking the image. */
    uploadAfterPick?: UploadImageOptions & {
      uploadFunction: (data: any) => Promise<any>;
    };
  }) => Promise<void>;

  /** Uploads the picked image.
   *
   * If you want to pick and immediatly upload it, use pickImage() with uploadAfterPick option,
   * as if you call pick() and upload(), the image's state may not be yet updated.
   *
   * @throws */
  upload: (fun: (data: any) => Promise<any>, opts?: UploadImageOptions) => Promise<any>;
  /** Resets the picked image. Automatically called if `resetOnUpload`. */
  reset: () => void;
};


async function uploadImageByUri({ imageUri, fun, mode }: {
  fun: (data: any) => Promise<any>;
  imageUri: string;
  mode: 'blob' | 'base64';
}) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.warn(e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', imageUri, true);
    xhr.send(null);
  });

  try {
    if (mode === 'base64') {
      const base64 = await blobToBase64(blob);
      await fun(base64);
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (mode === 'blob') {
      await fun(blob);
    }
  } finally {
    // We're done with the blob, close and release it
    (blob as any).close();
  }
}


export function useImagePicker({
  permissionNotGrantedText, ...rest
}: UseImagePickerProps = {}): UseImagePickerReturn {

  const [imageUri, setImage] = useState<null | string>(null);

  const uploadImageCore = useCallback(async ({ fun, opts, imageUri }: {
    fun: (data: any) => Promise<any>;
    opts?: UploadImageOptions;
    imageUri: string | null;
  }) => {
    if (!imageUri)
      throw new Error('Image not set!');

    await uploadImageByUri({ fun, imageUri, mode: opts?.mode ?? 'blob' });

    if (opts?.resetImageOnSuccess ?? true)
      setImage(null);
  }, []);


  const pick = useCallback<UseImagePickerReturn['pick']>(async (opts = {}) => {
    const { uploadAfterPick } = opts;
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted')
        throw new Error('Nós precisamos da permissão às suas mídias para escolher uma imagem!');
    }
    const result = await ImagePicker.launchImageLibraryAsync(rest);

    // Do nothing if cancelled
    if (result.cancelled) return;

    const imageUri = result.uri;
    if (uploadAfterPick) {
      const { uploadFunction, ...opts } = uploadAfterPick;
      await uploadImageCore({
        fun: uploadFunction,
        imageUri,
        opts,
      });
    }
    else
      setImage(imageUri);
  }, [rest, uploadImageCore]);


  const upload = useCallback<UseImagePickerReturn['upload']>(async (fun, opts) => {
    await uploadImageCore({ fun, opts, imageUri });
  }, [imageUri, uploadImageCore]);

  const reset = useCallback(() => {
    setImage(null);
  }, []);


  return {
    imageUri,
    pick,
    upload,
    isPicked: !!imageUri,
    reset,
  };
}