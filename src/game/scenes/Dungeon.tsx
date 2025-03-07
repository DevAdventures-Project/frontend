import ChatLayout from "@/components/ChatLayout";
import { socket } from "@/contexts/WebSocketContext";
import { reactToDom } from "@/lib/reactToDom";
import { type GameObjects, Scene, type Tilemaps } from "phaser";
import { EventBus } from "../EventBus";
import { type MovableScene, Player } from "../Player";

export class Dungeon extends Scene implements MovableScene {
  dungeon: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;
  map: Tilemaps.Tilemap;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  portal: GameObjects.Image;
  otherPlayersPositions = new Map<number, { x: number; y: number }>();
  private portalCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private isOverlapping = false;
  private portalRadius = 20;
  private playerRadius = 10;
  playerMovement: Player;

  constructor() {
    super("Dungeon");
  }

  preload() {
    this.add.dom(0, 0, reactToDom(<ChatLayout room="Dungeon" />));
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

  create() {
    this.dungeon = this.add.image(600, 450, "dungeon_tiles").setDepth(0);
    this.title = this.add.text(100, 100, "Dungeon", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    this.portal = this.add.image(590, 590, "portal");
    this.portal.setScale(0.1);
    this.portal.setDepth(1);

    this.player = this.add.sprite(410, 390, "player-run");
    this.player.setOrigin(0.5, 0.5);
    this.player.setDepth(2);

    this.portalCollider = new Phaser.Geom.Circle(
      this.portal.x,
      this.portal.y,
      this.portalRadius,
    );
    this.playerCollider = new Phaser.Geom.Circle(
      this.player.x,
      this.player.y - this.player.height / 4,
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
      scale: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.playerMovement = new Player(this);

    EventBus.emit("current-scene-ready", this);
  }

  updatePlayerCollider() {
    if (this.player && this.playerCollider) {
      this.playerCollider.x = this.player.x;
      this.playerCollider.y = this.player.y - this.player.height / 4;
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
    socket.emit("leaveRooms");
    socket.emit("joinRoom", "HUB");
    this.tweens.add({
      targets: this.portal,
      scale: 0.2,
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
    this.scene.start("Town");
  }
}
