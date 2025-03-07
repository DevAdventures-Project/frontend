import ProfilePage from "@/components/Profile";
import { reactToDom } from "@/lib/reactToDom";
import { Scene } from "phaser";

export class ProfileScene extends Scene {
  constructor() {
    super("ProfileScene");
  }

  preload() {
    this.add.dom(0, 0, reactToDom(<ProfilePage />));
  }

  stopScene() {
    this.scene.stop();
  }

  create() {}

  update() {}

  changeScene(prev: string) {
    this.scene.start(prev);
  }
}
