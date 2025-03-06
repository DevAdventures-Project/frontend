import { type GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Dungeon extends Scene {
  dungeon: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;

  constructor() {
    super("Dungeon");
  }

  preload() {
    this.load.spritesheet("player-run", "assets/npc/Knight/Run/Run-Sheet.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "player-idle",
      "assets/npc/Knight/Idle/Idle-Sheet.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  movePlayer(callback: (pos: { x: number; y: number }) => void) {
    console.log("movePlayer");
    if (this.player) {
      callback({ x: this.player.x, y: this.player.y });
    }
  }

  updatePositionPlayer(x: number, y: number) {
    console.log("updatePositionPlayer");
    if (this.player) {
      this.player.setPosition(x, y);
    }
  }

  create() {
    this.dungeon = this.add.image(600, 450, "dungeon").setDepth(0);
    this.title = this.add.text(100, 100, "The Hub", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    // Create the player sprite
    this.player = this.add.sprite(410, 390, "player-run");
    this.player.setOrigin(0.5, 0.5); // Center the sprite's origin

    // Create the running animation
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("player-run", {
        start: 0,
        end: 5, // 6 frames (0 to 5)
      }),
      frameRate: 10, // Frames per second
      repeat: -1, // Loop indefinitely
    });

    this.player.setOrigin(0.5, 1);

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player-idle", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.player.anims.play("idle");

    EventBus.emit("current-scene-ready", this);
  }

  changeScene() {
    this.scene.start("MainMenu");
  }
}
