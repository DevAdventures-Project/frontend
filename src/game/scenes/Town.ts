import { type GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Town extends Scene {
  town: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;

  constructor() {
    super("Town");
  }

  preload() {
    // Load the player spritesheet with correct frame dimensions
    this.load.spritesheet("player-run", "assets/npc/Knight/Run/Run-Sheet.png", {
      frameWidth: 64, // Update to the correct frame width
      frameHeight: 64, // Update to the correct frame height
    });

    this.load.spritesheet(
      "player-idle",
      "assets/npc/Knight/Idle/Idle-Sheet.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );

    this.load.image("tiles", "assets/tilemaps/tiles/town.png");
    this.load.tilemapTiledJSON("town", "assets/tilemaps/json/town.json");
  }

  movePlayer(callback: (pos: { x: number; y: number }) => void) {
    if (this.player) {
      callback({ x: this.player.x, y: this.player.y });
    }
  }

  updatePositionPlayer(x: number, y: number) {
    if (this.player) {
      this.player.setPosition(x, y);
    }
  }

  create() {
    this.town = this.add.image(512, 384, "town").setDepth(0);
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
    this.scene.start("Dungeon");
  }
}
