import type { GameObjects, Scene } from "phaser";
import type { Dialog, DialogManager } from "./DialogManager";
import { EventBus } from "./EventBus";

export interface NpcConfig {
  name: string;
  x: number;
  y: number;
  texture: string;
  animation?: string;
  interactionRadius: number;
  dialogs: Dialog;
}

export class Npc {
  private sprite: GameObjects.Sprite;
  private interactionCollider: Phaser.Geom.Circle;
  private interactionRadius: number;
  private dialog: Dialog;
  private interactionIndicator: GameObjects.Text;
  private isPlayerNearby = false;

  constructor(scene: Scene, config: NpcConfig) {
    this.interactionRadius = config.interactionRadius;
    this.dialog = config.dialogs;

    this.sprite = scene.add.sprite(config.x, config.y, config.texture);
    this.sprite.setOrigin(0.5, 1);

    if (config.animation) {
      this.sprite.anims.play(config.animation);
    }

    this.interactionCollider = new Phaser.Geom.Circle(
      config.x,
      config.y,
      this.interactionRadius,
    );

    this.interactionIndicator = scene.add.text(
      config.x,
      config.y - 50,
      "Press , to talk",
      {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 5, y: 2 },
      },
    );
    this.interactionIndicator.setOrigin(0.5, 0.5);
    this.interactionIndicator.setVisible(false);

    EventBus.on("player-interact", this.onPlayerInteract, this);
  }

  public update(playerPosition: Phaser.Geom.Circle): void {
    const isOverlapping = Phaser.Geom.Intersects.CircleToCircle(
      playerPosition,
      this.interactionCollider,
    );

    if (isOverlapping && !this.isPlayerNearby) {
      this.isPlayerNearby = true;
      this.interactionIndicator.setVisible(true);
    } else if (!isOverlapping && this.isPlayerNearby) {
      this.isPlayerNearby = false;
      this.interactionIndicator.setVisible(false);
    }
  }

  private onPlayerInteract(playerPos: { x: number; y: number }): void {
    const distance = Phaser.Math.Distance.Between(
      playerPos.x,
      playerPos.y,
      this.sprite.x,
      this.sprite.y,
    );

    if (distance <= this.interactionRadius) {
      let dialogManager: DialogManager | undefined;
      EventBus.emit("get-dialog-manager", (manager: DialogManager) => {
        dialogManager = manager;
      });

      if (dialogManager) {
        dialogManager.showDialog(this.dialog);
        this.interactionIndicator.setVisible(false);
      } else {
        console.error("Dialog manager not found");
      }
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public getCollider(): Phaser.Geom.Circle {
    return this.interactionCollider;
  }

  public destroy(): void {
    EventBus.off("player-interact", this.onPlayerInteract, this);
    this.sprite.destroy();
    this.interactionIndicator.destroy();
  }

  public setDialogs(dialog: Dialog): void {
    this.dialog = dialog;
  }
}
