import ChatLayout from "@/components/ChatLayout";
import CreateQuest from "@/components/CreateQuest";
import QuestList from "@/components/QuestList";
import { socket } from "@/contexts/WebSocketContext";
import { reactToDom } from "@/lib/reactToDom";
import type { UserChat } from "@/models/User";
import { type GameObjects, Scene, type Tilemaps } from "phaser";
import { DialogManager } from "../DialogManager";
import { EventBus } from "../EventBus";
import { Npc } from "../Npc";
import { type MovableScene, Player } from "../Player";
import { calculateOffsets, getTileCoordinates } from "./GridUtils";

export class Dungeon extends Scene implements MovableScene {
  dungeon: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;
  map: Tilemaps.Tilemap;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  npcCollider: Phaser.Geom.Circle;
  portal: GameObjects.Image;
  questListDom: GameObjects.DOMElement | null = null;
  createQuestDom: GameObjects.DOMElement | null = null;
  playerMovement: Player;
  debugDot: GameObjects.Graphics;
  dialogManager: DialogManager;
  obstaclesDebugGraphics: GameObjects.Graphics;
  wizardNpc: Npc;
  private lastValidX: number;
  private lastValidY: number;
  private portalCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private portalRadius = 30;
  private playerRadius = 10;
  private offsetX: number;
  private offsetY: number;
  tileWidth: number;
  tileHeight: number;
  isOverlapping = false;

  constructor() {
    super("Cobol");
    this.tileWidth = 12;
    this.tileHeight = 12;
    this.lastValidX = 410;
    this.lastValidY = 390;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  preload() {
    this.add.dom(
      0,
      0,
      reactToDom(
        <ChatLayout
          user={
            {
              id: localStorage.getItem("userId")
                ? Number.parseInt(localStorage.getItem("userId") as string)
                : null,
              pseudo: localStorage.getItem("pseudo"),
            } as UserChat
          }
          changeScene={() => {
            this.scene.launch("MarketplaceScene");
          }}
        />,
      ),
    );
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
    this.load.spritesheet(
      "npc-idle",
      "assets/npc/Wizzard/Idle/Idle-Sheet.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.image("dungeon_tiles", "assets/tilemaps/tiles/dungeon.png");
    this.load.image("portal", "assets/tilemaps/tiles/portal.png");
  }

  create() {
    this.dungeon = this.add.image(512, 384, "dungeon_tiles").setDepth(0);
    this.title = this.add.text(100, 100, "Cobol", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    const mapWidthInTiles = 85;
    const mapHeightInTiles = 64;
    const { offsetX, offsetY } = calculateOffsets(
      1024,
      768,
      mapWidthInTiles,
      mapHeightInTiles,
      this.tileWidth,
      this.tileHeight,
    );
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.debugDot = this.add.graphics();
    this.obstaclesDebugGraphics = this.add.graphics();

    this.portal = this.add.image(770, 290, "portal");
    this.portal.setScale(0.2);
    this.portal.setDepth(1);

    this.player = this.add.sprite(200, 660, "player-run");
    this.lastValidX = this.player.x;
    this.lastValidY = this.player.y;
    this.player.setOrigin(0.5, 0.5);
    this.player.setScale(2);
    this.player.setDepth(2);

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

    this.createAnimations();
    this.player.setOrigin(0.5, 1);
    this.player.anims.play("idle");

    this.tweens.add({
      targets: this.portal,
      scale: 0.15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.setupNpc();
    this.playerMovement = new Player(this);
    EventBus.emit("current-scene-ready", this);
  }

  setupNpc(): void {
    this.dialogManager = new DialogManager(this);
    EventBus.on(
      "get-dialog-manager",
      (callback: (dialogManager: DialogManager) => void) => {
        if (typeof callback === "function") {
          callback(this.dialogManager);
        }
      },
    );

    const npcName = "M. Noled";
    this.wizardNpc = new Npc(this, {
      name: npcName,
      x: 350,
      y: 300,
      texture: "npc-idle",
      animation: "npc-idle",
      interactionRadius: 50,
      dialogs: {
        npcName: npcName,
        messages: ["Bienvenue dans le donjon BDDSM, veux tu voir mes quêtes ?"],
        responses: [
          {
            text: "Voir les quêtes",
            action: () => {
              this.showQuestList();
            },
          },
          {
            text: "Non, merci",
            action: () => {
              this.cleanupQuestUIs();
            },
          },
        ],
      },
    });
    this.npcCollider = this.wizardNpc.getCollider();
  }

  createAnimations(): void {
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("player-run", {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player-idle", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "npc-idle",
      frames: this.anims.generateFrameNumbers("npc-idle", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  showQuestList(): void {
    this.cleanupQuestUIs();
    this.questListDom = this.add.dom(
      850,
      100,
      reactToDom(<QuestList category="Cobol" />),
    );
    this.questListDom.setDepth(1000);
  }

  showCreateQuest(): void {
    this.cleanupQuestUIs();
    this.createQuestDom = this.add.dom(850, 50, reactToDom(<CreateQuest />));
    this.createQuestDom.setDepth(1000);
  }

  private cleanupQuestUIs(): void {
    if (this.questListDom) {
      this.questListDom.destroy();
      this.questListDom = null;
    }
    if (this.createQuestDom) {
      this.createQuestDom.destroy();
      this.createQuestDom = null;
    }
  }

  updatePlayerCollider(): void {
    if (this.player && this.playerCollider) {
      this.playerCollider.x = this.player.x;
      this.playerCollider.y = this.player.y - this.player.height / 4;
    }
  }

  checkPortalCollision(): void {
    const isColliding = Phaser.Geom.Intersects.CircleToCircle(
      this.playerCollider,
      this.portalCollider,
    );

    if (isColliding) {
      this.activatePortal("Town", this.portal);
    }
  }

  checkPortalCollisions(): void {
    this.checkPortalCollision();
  }

  activatePortal(target: string, portal: GameObjects.Image): void {
    socket.emit("leaveRooms");
    socket.emit("joinRoom", target);
    this.tweens.add({
      targets: portal,
      scale: 0.2,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.changeScene(target);
      },
    });
    this.cameras.main.flash(500, 255, 255, 255);
  }

  update(): void {
    this.updatePlayerCollider();
    this.checkPortalCollision();
    this.playerMovement.update();
    this.wizardNpc.update(this.playerCollider);

    if (this.isPositionBlocked(this.player.x, this.player.y)) {
      this.player.x = this.lastValidX;
      this.player.y = this.lastValidY;
    } else {
      this.lastValidX = this.player.x;
      this.lastValidY = this.player.y;
    }
  }

  changeScene(scene: string): void {
    this.cleanupQuestUIs();
    this.scene.start(scene);
  }

  isPositionBlocked(x: number, y: number): boolean {
    if (this.obstacles.length === 0) {
      return false;
    }
    const mapWidthInTiles = 85;
    const { tileX, tileY } = getTileCoordinates(
      x,
      y,
      this.tileWidth,
      this.tileHeight,
      this.offsetX,
      this.offsetY,
    );
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= mapWidthInTiles ||
      tileY >= Math.floor(this.obstacles.length / mapWidthInTiles)
    ) {
      return true;
    }
    const index = tileY * mapWidthInTiles + tileX;
    return this.obstacles[index] !== 0;
  }

  obstacles: number[] = [
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    75646, 75646, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0,
    75646, 75646, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 75646, 75646, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0,
    0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    0, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0,
    0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 0, 0, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646,
    75646, 75646, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646, 75646,
    75646, 75646, 75646, 75646, 0, 0, 0, 0, 0, 0, 75646, 75646, 75646, 75646,
    75646,
  ];
}
