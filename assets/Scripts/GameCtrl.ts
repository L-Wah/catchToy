import {
  _decorator,
  Component,
  Node,
  director,
  Contact2DType,
  Collider2D,
  IPhysics2DContact,
  Button,
  Sprite,
  SpriteFrame,
  tween,
  v3,
  resources,
  Vec3,
  animation,
  Animation,
  AnimationClip,
  Quat,
} from 'cc';
const { ccclass, property } = _decorator;

import { Audio } from './Audio';
import { Scored } from './Scored';

@ccclass('GameCtrl')
export class GameCtrl extends Component {
  public isOver: boolean;

  @property({ type: Scored })
  public scored: Scored | null = null;

  public assetList = [];

  public assetGetList = [];

  @property({
    type: Audio,
    tooltip: 'add audio controller',
  })
  public clip: Audio;

  @property({ type: Node })
  public playBtn: Node | null = null;

  @property({ type: Node })
  public claw: Node | null = null;

  public canClick: boolean = true;

  public getToy: boolean = false;

  public clawInitImg: SpriteFrame | null = null;

  public clawState: boolean = false; // 爪子收紧状态（true:收紧，false放开）

  //things to do when the game loads
  onLoad() {
    //game is over
    this.isOver = true;

    //reset everything and start the game again
    this.resetGame();

    this.clawInitImg = this.claw.getComponent(Sprite).spriteFrame;

    let url = '/go';
    resources.loadDir(url, SpriteFrame, null, (err, spriteFrame) => {
      if (err) {
        return console.error('SpriteFrame load failed, err:' + err.message);
      }
      const temp = spriteFrame.reduce((acc, val) => {
        let char = val.name.charAt(0);
        acc[char] = [].concat(acc[char] || [], val);
        return acc;
      }, {});

      Object.keys(temp).map(el => {
        temp[el].sort((a: { name: string }, b: { name: string }) => {
          return a.name < b.name ? -1 : 1;
        });
        this.assetList.push(temp[el]);
      });
      console.log(this.assetList);
    });

    let getUrl = '/get';
    resources.loadDir(getUrl, SpriteFrame, null, (err, spriteFrame) => {
      if (err) {
        return console.error('SpriteFrame load failed, err:' + err.message);
      }
      this.assetGetList = spriteFrame.sort((a, b) => {
        return a.name < b.name ? -1 : 1;
      });
      console.log(this.assetGetList);
    });
  }

  @property({ type: Node })
  public startMenu: Node | null = null;

  //when the game starts again, do these things.
  resetGame() {
    this.scored.setScored(0);
    this.startMenu.active = true;
  }

  //what to do when the game is starting.
  startGame() {
    //game is starting
    this.isOver = false;

    //resume game
    director.resume();

    this.startMenu.active = false;

    this.clip.onAudioQueue(0, true, 0.5);

    //hide high score and other text
    // this.result.hideResult();

    let playBtn = this.playBtn.getComponent(Button);
    playBtn.interactable = true;

    this.nAnim = this.animNode.addComponent(Animation);
    this.createAnim();

    // 监听收紧爪子播放结束
    this.claw.getComponent(Animation).on(
      Animation.EventType.FINISHED,
      msg => {
        // console.log('end-claw', msg);
        if (this.getToy) {
          let isGet = Math.random();
          // 设定概率（夹到的概率）
          // if (isGet > 0.01) {
          console.log('get!');
          this.clip.onAudioQueue(2);

          this.claw.getComponent(Sprite).spriteFrame =
            this.assetGetList[this.random];
          this.isOver = true;
          this.nAnim.stop();
          this.animNode.getComponent(Sprite).destroy();

          setTimeout(() => {
            this.isOver = false;
            this.animNode.addComponent(Sprite);
            this.resetAnim();
          }, 2000);
          // }
        }
        if (this.clawState) {
          this.resetHanger();
        }
      },
      this
    );
  }

  resetHanger() {
    // getToy同步给动画播放完回调后的状态
    let getToy = this.getToy;
    console.log(getToy, 'getToy');
    let isGet = Math.random();
    tween(this.claw)
      .to(
        1,
        {
          position: v3(0, 730, 0),
        },
        {
          easing: getToy ? 'backIn' : 'fade',
        }
      )
      .call(() => {
        if (getToy && isGet > 0.01 && this.random !== 2) {
          console.log('松开爪子掉落');
          // 设定概率（夹子松开的概率）
          // 爪子松开
          let clawAnim = this.claw.getComponent(Animation);
          let clip = clawAnim.clips[0];
          clip.name = 'reClaw';
          clip.wrapMode = 36; //模式
          clawAnim.addClip(clip);
          clawAnim.play('reClaw');
          this.clawState = false;
          // 玩偶掉下去
          let toyNode = this.node.parent
            .getChildByName('Canvas')
            .getChildByName('ToyFall');
          toyNode.active = true;
          let spriteNode = toyNode.getComponent(Sprite);
          spriteNode.spriteFrame = Array.isArray(this.assetList[this.random])
            ? this.assetList[this.random][0]
            : this.assetList[this.random];
          tween(toyNode)
            .to(
              0.8,
              {
                position: v3(20, -150, 0),
                rotation: Quat.fromEuler(new Quat(0, 0, 0, 0), 0, 0, -10),
              },
              {
                easing: 'sineIn',
              }
            )
            .call(() => {
              toyNode.active = false;
              toyNode.setPosition(20, 500, 0);
              toyNode.setRotation(
                Quat.fromEuler(new Quat(0, 0, 0, 0), 0, 0, -30)
              );
            })
            .start();
        } else {
          console.log('爪子复原');
          this.claw.getComponent(Sprite).spriteFrame = this.clawInitImg;
          // 控制加分
          if (this.random === 2) {
            this.clip.onAudioQueue(1);
            this.scored.showPrice(true);
            setTimeout(() => {
              this.scored.showPrice(false);
              this.scored.addScored(1);
            }, 500);
          }
        }
        if (this.getToy) {
          this.getToy = false;
        }
        this.canClick = true;
        this.playBtn.getComponent(Button).transition = 2;
      })
      .start();
  }

  clickCatchBtn() {
    if (this.canClick && !this.isOver) {
      this.canClick = false;
      this.playBtn.getComponent(Button).transition = 0;
      this.clip.onAudioQueue(4);
      tween(this.claw)
        .to(
          0.8,
          {
            position: v3(0, 230, 0),
          },
          {
            easing: 'fade',
          }
        )
        .call(() => {
          let clawAnim = this.claw.getComponent(Animation);
          let clip = clawAnim.clips[0];
          clip.name = 'claw';
          clip.wrapMode = 1; //模式
          clawAnim.addClip(clip);
          clawAnim.play('claw');
          this.clawState = true;
        })
        .start();
    }
  }

  gameOver() {
    //show the results
    // this.result.showResult();

    //game is over
    this.isOver = true;

    let playBtn = this.playBtn.getComponent(Button);
    playBtn.interactable = false;

    //make the game over sound
    this.clip.stopAudio();
    this.clip.onAudioQueue(3);

    //pause the game
    director.pause();
  }

  testStop() {
    if (!this.isOver) {
      this.isOver = true;
      this.clip.stopAudio();
      this.clip.onAudioQueue(3);

      let playBtn = this.playBtn.getComponent(Button);
      playBtn.interactable = false;

      this.nAnim.stop();
      this.animNode.getComponent(Sprite).destroy();
      this.resetGame();
    }
  }

  public random: number = 0;
  public nAnim: Animation | null = null;

  @property({ type: Node })
  public animNode: Node | null = null;

  createAnim() {
    this.nAnim.clips = [];
    let clip = AnimationClip.createWithSpriteFrames(
      this.assetList[this.random],
      this.assetList[this.random].length
    );

    clip.name = 'role';
    clip.speed = 1.1; //速度
    clip.sample = 1; // 每秒播放帧数
    clip.wrapMode = 2; //模式

    // rotation轨道
    let deg = 0;
    if (this.random !== 2) {
      deg = 5;
    }
    const track = new animation.QuatTrack();
    track.path = new animation.TrackPath().toProperty('rotation');
    const [q] = track.channels();

    const newQuat = Quat.fromEuler(new Quat(0, 0, 0, 0), 0, 0, deg * 2);
    const reNewQuat = Quat.fromEuler(new Quat(0, 0, 0, 0), 0, 0, -deg);

    const vec3KeyFrames = [
      [0, 0],
      [0.25, newQuat],
      [0.5, 0],
      [0.75, reNewQuat],
      [1, 0],
    ] as [number, Quat][];
    q.curve.assignSorted(
      vec3KeyFrames.map(([time, quat]) => [time, { value: quat }])
    );
    clip.addTrack(track);

    this.nAnim.addClip(clip);
    this.nAnim.defaultClip = clip;

    this.nAnim.play('role');
    //监听播放结束
    this.nAnim.on(
      Animation.EventType.FINISHED,
      msg => {
        console.log('end', msg);
      },
      this
    );
  }

  //hit detection call
  hangerStruck() {
    //check if the collider hit other colliders
    let collider = this.claw.getComponent(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    //will be called once when two colliders begin to contact
    console.log('hitSomething', this.random);
    this.getToy = true;
  }

  resetAnim() {
    this.animNode.setPosition(v3(500, 0, 0));
    this.random = parseInt(String(Math.random() * this.assetList.length));
    this.createAnim();
    this.play_time = 0;
  }

  public play_time: number = 0; //toy移动时间
  public gameSpeed: number = 200; //toy移动速度
  public showWidth: number = 500; //toy移出屏幕外
  public tempStartLocation = new Vec3();

  //every time the game updates, do this
  update(deltaTime: number) {
    if (!this.isOver) {
      this.tempStartLocation = this.animNode.position;
      this.tempStartLocation.x -= this.gameSpeed * deltaTime;
      if (this.tempStartLocation.x <= -this.showWidth) {
        this.tempStartLocation.x = this.showWidth;
      }
      this.animNode.setPosition(this.tempStartLocation);

      this.play_time += deltaTime;
      if (this.play_time < (this.showWidth * 2) / this.gameSpeed) {
        // run
        this.hangerStruck();
      } else {
        // 切换动画
        this.resetAnim();
      }
    }
  }
}
