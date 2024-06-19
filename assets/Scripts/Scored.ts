import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Scored')
export class Scored extends Component {
  public scored: number = 0;

  setScored(num: number) {
    this.scored = num;
    this.node.getChildByName('Label').getComponent(Label).string = String(
      this.scored
    );
  }

  addScored(num: number) {
    this.scored += num;
    this.node.getChildByName('Label').getComponent(Label).string = String(
      this.scored
    );
  }

  showPrice(state: boolean) {
    let particle2D = this.node.getChildByName('Particle2D');
    particle2D.active = state;
  }
}
