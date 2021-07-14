import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  public videos = [];
  private VIDEOS_KEY = 'videos';

  constructor() { }

  async loadVideos() {
    const videoList = await Storage.get({ key: this.VIDEOS_KEY });
    this.videos = JSON.parse(videoList.value) || [];
    return this.videos;
  }

  async storeVideo(blob) {
    const fileName = new Date().getTime() + '.mp4';
    const base64Data = await this.convertBlobToBase64(blob) as string;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    this.videos.unshift(savedFile.uri);
    console.log('my array now: ', this.videos);
    return Storage.set({
      key: this.VIDEOS_KEY,
      value: JSON.stringify(this.videos)
    });
  }

  async getVideoUrl(fullPath) {
    const path = fullPath.substr(fullPath.lastIndexOf('/') + 1);
    const file = await Filesystem.readFile({
      path: path,
      directory: Directory.Data
    });
    return `data:video/mp4;base64,${file.data}`;
  }

  // Hlper function
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

}
