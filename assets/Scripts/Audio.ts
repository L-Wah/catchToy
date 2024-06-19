import { _decorator, Component, AudioClip, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Audio')
export class Audio extends Component {
  @property({
    type: [AudioClip],
    tooltip: 'place audio clip here',
  })
  public clips: AudioClip[] = [];

  @property({
    type: AudioSource,
    tooltip: 'place audio node here',
  })
  public audioSource: AudioSource = null!;

  @property({
    type: AudioSource,
    tooltip: 'place audio-bg node here',
  })
  public audioSourceBg: AudioSource = null!;

  //place correct audio clip in the audio player and play the audio
  onAudioQueue(index: number, loop: boolean = false, volumeScale: number = 1) {
    //place audio clip into the the player
    let clip: AudioClip = this.clips[index];

    if (loop) {
      // 背景音乐
      this.audioSourceBg.clip = clip;
      this.audioSourceBg.loop = true;
      this.audioSourceBg.volume = volumeScale;
      this.audioSourceBg.play();
    } else {
      // 音效
      //play the audio just once
      this.audioSource.volume = 1;
      this.audioSource.loop = false;
      this.audioSource.playOneShot(clip, volumeScale);
    }
  }

  stopAudio() {
    this.audioSourceBg.stop();
  }
}
