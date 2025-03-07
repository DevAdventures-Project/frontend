import Marketplace from "@/components/Marketpace";
import { reactToDom } from "@/lib/reactToDom";
import { Scene } from "phaser";

export class MarketplaceScene extends Scene {
  constructor() {
    super("MarketplaceScene");
  }

  preload() {
    this.add.dom(
      0,
      0,
      reactToDom(
        <Marketplace
          leaveScene={() => {
            this.stopScene();
          }}
        />,
      ),
    );
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
