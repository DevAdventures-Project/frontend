import type { GameObjects, Scene } from "phaser";
import { EventBus } from "./EventBus";

export interface MovableScene {
  player: GameObjects.Sprite;
  updatePlayerCollider(): void;
  checkPortalCollision(): void;
  checkNpcCollision?(): void;
}

export class Player {
  private scene: Scene & MovableScene;
  private speedMovement: number;
  private playerPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Scene & MovableScene, speedMovement = 10) {
    this.scene = scene;
    this.speedMovement = speedMovement;
    this.initializePosition();
  }

  private initializePosition(): void {
    if (this.scene.player) {
      this.playerPosition = {
        x: this.scene.player.x,
        y: this.scene.player.y,
      };
    }
  }

  public getPosition(): { x: number; y: number } {
    return this.playerPosition;
  }

  public moveUp(): void {
    this.updatePosition(
      this.playerPosition.x,
      this.playerPosition.y - this.speedMovement,
    );
  }

  public moveDown(): void {
    this.updatePosition(
      this.playerPosition.x,
      this.playerPosition.y + this.speedMovement,
    );
  }

  public moveLeft(): void {
    this.updatePosition(
      this.playerPosition.x - this.speedMovement,
      this.playerPosition.y,
    );
    if (this.scene.player) {
      this.scene.player.setFlipX(true);
    }
  }

  public moveRight(): void {
    this.updatePosition(
      this.playerPosition.x + this.speedMovement,
      this.playerPosition.y,
    );
    if (this.scene.player) {
      this.scene.player.setFlipX(false);
    }
  }

  public startRunAnimation(): void {
    if (this.scene.player) {
      this.scene.player.anims.play("run", true);
    }
  }

  public startIdleAnimation(): void {
    if (this.scene.player) {
      this.scene.player.anims.play("idle", true);
    }
  }

  public updatePosition(x: number, y: number): void {
    if (!this.scene.player) return;

    this.playerPosition = { x, y };
    this.scene.player.setPosition(x, y);
    this.scene.updatePlayerCollider();
    this.scene.checkPortalCollision();

    if (this.scene.checkNpcCollision) {
      this.scene.checkNpcCollision();
    }

    EventBus.emit("player-position-updated", this.playerPosition);
  }

  public setPosition(x: number, y: number): void {
    this.updatePosition(x, y);
  }
}
