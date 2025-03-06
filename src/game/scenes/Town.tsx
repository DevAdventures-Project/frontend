import ChatLayout from "@/components/ChatLayout";
import { reactToDom } from "@/lib/reactToDom";
import { type GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Town extends Scene {
  town: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;
  portal: GameObjects.Image;
  private portalCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private isOverlapping = false;
  private portalRadius = 30;
  private playerRadius = 10;

  constructor() {
    super("Town");
  }

  preload() {
    this.add.dom(0, 0, reactToDom(<ChatLayout />));
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

    this.load.image("star", "star.png");
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
      this.updatePlayerCollider();
      this.checkPortalCollision();
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

    this.portal = this.add.image(730, 352, "star");
    this.portal.setScale(0.5);
    this.player = this.add.sprite(410, 390, "player-run");
    this.player.setOrigin(0.5, 0.5);

    // Initialiser les colliders
    this.portalCollider = new Phaser.Geom.Circle(
      this.portal.x,
      this.portal.y,
      this.portalRadius,
    );
    this.playerCollider = new Phaser.Geom.Circle(
      this.player.x,
      this.player.y,
      this.playerRadius,
    );

    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("player-run", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
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

    this.tweens.add({
      targets: this.portal,
      scale: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    EventBus.emit("current-scene-ready", this);
  }

  updatePlayerCollider() {
    if (this.player && this.playerCollider) {
      this.playerCollider.x = this.player.x;
      this.playerCollider.y = this.player.y - this.player.height / 2;
    }
  }

  checkPortalCollision() {
    const isColliding = Phaser.Geom.Intersects.CircleToCircle(
      this.playerCollider,
      this.portalCollider,
    );

    if (isColliding && !this.isOverlapping) {
      this.isOverlapping = true;
      this.activatePortal();
    } else if (!isColliding && this.isOverlapping) {
      this.isOverlapping = false;
    }
  }

  activatePortal() {
    this.tweens.add({
      targets: this.portal,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.changeScene();
      },
    });

    this.cameras.main.flash(500, 255, 255, 255);
  }

  update() {
    this.updatePlayerCollider();
    this.checkPortalCollision();
  }

  changeScene() {
    this.scene.start("Dungeon");
  }
}
