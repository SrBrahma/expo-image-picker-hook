<!-- <img src=".logo.png" alt=expo-image-picker-hook/><br/> -->

<div align="center">

[![npm](https://img.shields.io/npm/v/expo-image-picker-hook)](https://www.npmjs.com/package/expo-image-picker-hook)
[![TypeScript](https://badgen.net/npm/types/env-var)](http://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
<!-- [![npm](https://img.shields.io/npm/dm/expo-image-picker-hook)](https://www.npmjs.com/package/expo-image-picker-hook) -->
</div>

# expo-image-picker-hook

Convenient hook for `expo-image-picker`.

Supports `blob` and `base64`.

## 💿 Installation
```bash
expo install expo-image-picker-hook expo-image-picker
```

## 📖 Usage

```tsx
function MyComponent() {
  const ImagePicker = useImagePicker({
    aspect: [2, 1],
    quality: 0.9,
    permissionNotGrantedText: 'You need to give the app permission to select the image.',
  })

  const pick = () => {
    ImagePicker.pick()
      .catch(err => Alert.alert('Error', err.message))
  }

  const upload = () => {
    ImagePicker.upload({ fun: (image) => myApi.uploadImage(image) }, { mode: 'base64' })
      .catch(err => Alert.alert('Error', err.message))
  }

  return (
    <View>
      <Image source={{ uri: ImagePicker.uri }}>
      <Button onPress={pick}>
      <Button onPress={upload} disabled={!ImagePicker.isPicked}>
    </View>
  )
}
```

## 📰 [Changelog](CHANGELOG.md)
