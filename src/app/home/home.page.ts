import { VideoService } from './../services/video.service';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';

import { Capacitor } from '@capacitor/core';
import * as PluginsLibrary from 'capacitor-video-player';
import { CapacitorVideoPlayer } from 'capacitor-video-player';
// const { CapacitorVideoPlayer } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {

  mediaRecorder: MediaRecorder;
  videoPlayer: any;
  isRecording = false;
  videos = [];

  @ViewChild('video') captureElement: ElementRef;

  constructor(private videoService: VideoService, private changeDetector: ChangeDetectorRef) { }

  async ngAfterViewInit() {
    this.videos = await this.videoService.loadVideos();

    // Initialise the video player plugin
    if (Capacitor.isNativePlatform) {
      this.videoPlayer = CapacitorVideoPlayer;
    } else {
      this.videoPlayer = PluginsLibrary.CapacitorVideoPlayer;
    }
  }

  async recordVideo() {
    // Create a stream of video capturing
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user'
      },
      audio: true
    });

    // Show the stream inside our video object
    this.captureElement.nativeElement.srcObject = stream;
    this.isRecording = true;

    const options = { mimeType: 'video/webm' };
    this.mediaRecorder = new MediaRecorder(stream, options);
    let chunks = [];

    // Store chunks of recorded video
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Store the video on stop
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: 'video/webm' });
      // Store the video
      await this.videoService.storeVideo(videoBuffer);
      // reload the list
      this.videos = this.videoService.videos;
      this.changeDetector.detectChanges();
    };

    // Start recording wth chunks of data
    this.mediaRecorder.start(100);
    this.isRecording = true;

  }

  stopRecord() {
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
  }

  async play(video) {
    const base64data = await this.videoService.getVideoUrl(video);

    await this.videoPlayer.initPlayer({
      mode: 'fullscreen',
      url: base64data,
      playerId: 'fullscreen',
      componentTag: 'app-home'
    });
  }

}
