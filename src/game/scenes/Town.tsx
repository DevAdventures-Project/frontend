import ChatLayout from "@/components/ChatLayout";
import CreateQuest from "@/components/CreateQuest";
import LeaderBoard from "@/components/LeaderBoard";
import { socket } from "@/contexts/WebSocketContext";
import { reactToDom } from "@/lib/reactToDom";
import type { OtherPlayer } from "@/models/OtherPlayer";
import type { UserChat } from "@/models/User";
import { type GameObjects, Scene } from "phaser";
import { DialogManager } from "../DialogManager";
import { EventBus } from "../EventBus";
import { Npc } from "../Npc";
import { type MovableScene, Player } from "../Player";
import { calculateOffsets, getTileCoordinates } from "./GridUtils";

interface PortalConfig {
  x: number;
  y: number;
  target: string;
}

interface Portal {
  portal: GameObjects.Image;
  collider: Phaser.Geom.Circle;
  target: string;
}

export class Town extends Scene implements MovableScene {
  town: GameObjects.Image;
  title: GameObjects.Text;
  textetp1: GameObjects.Text;
  textetp2: GameObjects.Text;
  textetp3: GameObjects.Text;
  player: GameObjects.Sprite;
  portals: Portal[] = [];
  npcCollider: Phaser.Geom.Circle;
  playerCollider: Phaser.Geom.Circle;
  isOverlapping = false;
  portalRadius = 20;
  playerRadius = 10;
  playerMovement: Player;
  dialogManager: DialogManager;
  wizardNpc: Npc;
  questListDom: GameObjects.DOMElement | null = null;
  createQuestDom: GameObjects.DOMElement | null = null;
  tileWidth: number;
  tileHeight: number;
  lastValidX: number;
  lastValidY: number;
  private offsetX: number;
  private offsetY: number;
  otherPlayers: Map<number, GameObjects.Sprite> = new Map();

  constructor() {
    super("Town");
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
    this.addLeaderboardButton();

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

    this.load.image("tiles", "assets/tilemaps/tiles/town.png");
    this.load.tilemapTiledJSON("town", "assets/tilemaps/json/town.json");
    this.load.image("portal", "assets/tilemaps/tiles/portal.png");
  }

  create() {
    socket.emit("getOtherPlayers");

    socket.on("otherPlayers", (data) => {
      const otherPlayers = JSON.parse(data).map((player: string) =>
        JSON.parse(player),
      );
      this.otherPlayers.clear();
      otherPlayers.forEach((player: OtherPlayer) => {
        this.newOtherPlayer(player);
      });
    });

    socket.on("joinedRoom", (data) => {
      const player: OtherPlayer = JSON.parse(data);
      this.newOtherPlayer(player);
    });

    socket.on("leftRoom", (data) => {
      if (!data || data === null) return;

      const player: OtherPlayer = JSON.parse(data);
      const otherPlayer = this.otherPlayers.get(player.id);

      if (otherPlayer) {
        otherPlayer.destroy();
        this.otherPlayers.delete(player.id);
      }
    });

    socket.on("leftRooms", (data) => {
      if (!data || data === null) return;
      const player: OtherPlayer = JSON.parse(data);
      this.otherPlayers.get(player.id)?.destroy();
      this.otherPlayers.delete(player.id);
    });

    socket.on("position", (data) => {
      const player: OtherPlayer = JSON.parse(data);
      this.updateOtherPlayerPosition(player);
    });

    socket.emit("getOtherPlayers");

    this.town = this.add.image(512, 384, "town").setDepth(0);
    this.title = this.add.text(100, 100, "The Hub", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    this.textetp1 = this.add.text(410, 220, "Javascript", {
      fontFamily: "Arial Black",
      fontSize: 20,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    this.textetp2 = this.add.text(690, 280, "Cobol", {
      fontFamily: "Arial Black",
      fontSize: 20,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    this.textetp3 = this.add.text(490, 520, "Scratch", {
      fontFamily: "Arial Black",
      fontSize: 20,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    const mapWidthInTiles = 70;
    const mapHeightInTiles = Math.floor(
      this.obstacles.length / mapWidthInTiles,
    );
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

    const portalConfigs: PortalConfig[] = [
      { x: 730, y: 352, target: "Cobol" },
      { x: 470, y: 302, target: "Javascript" },
      { x: 540, y: 482, target: "Scratch" },
    ];

    portalConfigs.forEach((config) => {
      const p = this.add.image(config.x, config.y, "portal");
      p.setScale(0.1);
      p.setDepth(1);
      const collider = new Phaser.Geom.Circle(p.x, p.y, this.portalRadius);
      this.portals.push({ portal: p, collider, target: config.target });
      this.tweens.add({
        targets: p,
        scale: 0.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.player = this.add.sprite(410, 402, "player-run");
    this.lastValidX = this.player.x;
    this.lastValidY = this.player.y;
    this.player.setOrigin(0.5, 0.5);
    this.player.setDepth(2);
    this.playerCollider = new Phaser.Geom.Circle(
      this.player.x,
      this.player.y,
      this.playerRadius,
    );
    this.createAnimations();
    this.player.setOrigin(0.5, 1);

    this.dialogManager = new DialogManager(this);
    EventBus.on(
      "get-dialog-manager",
      (callback: (dialogManager: DialogManager) => void) => {
        if (typeof callback === "function") {
          callback(this.dialogManager);
        }
      },
    );

    const npcName = "M. Sananes";
    this.wizardNpc = new Npc(this, {
      name: npcName,
      x: 670,
      y: 440,
      texture: "npc-idle",
      animation: "npc-idle",
      interactionRadius: 50,
      dialogs: {
        npcName: npcName,
        messages: ["Salut je suis le goat du C, tu veux créer une quête ?"],
        responses: [
          {
            text: "Créer une quête",
            action: () => {
              this.showCreateQuest();
            },
          },
          {
            text: "Non merci",
            action: () => {
              this.cleanupQuestUIs();
            },
          },
        ],
      },
    });
    this.npcCollider = this.wizardNpc.getCollider();
    this.playerMovement = new Player(this);
    EventBus.emit("current-scene-ready", this);
  }
  updateOtherPlayerPosition(player: OtherPlayer) {
    return;
  }
  newOtherPlayer(player: OtherPlayer) {
    return;
  }

  addLeaderboardButton(): void {
    const gameHeight = this.sys.game.canvas.height;
    const leaderboardDom = this.add.dom(
      300,
      gameHeight,
      reactToDom(<LeaderBoard />),
    );
    leaderboardDom.setDepth(1000);
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

  checkPortalCollision(): void {
    this.checkPortalCollisions();
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

  updatePlayerCollider() {
    if (this.player && this.playerCollider) {
      this.playerCollider.x = this.player.x;
      this.playerCollider.y = this.player.y - this.player.height / 2;
    }
  }

  checkPortalCollisions() {
    for (const p of this.portals) {
      if (
        Phaser.Geom.Intersects.CircleToCircle(this.playerCollider, p.collider)
      ) {
        this.activatePortal(p.target, p.portal);
        break;
      }
    }
  }

  activatePortal(target: string, portal: GameObjects.Image) {
    if (this.dialogManager.isActive()) return;
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

  update() {
    this.updatePlayerCollider();
    this.checkPortalCollisions();
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

  changeScene(target: string) {
    this.otherPlayers.forEach((otherPlayer, id) => {
      otherPlayer.destroy();
      this.otherPlayers.delete(id);
    });

    this.cleanupQuestUIs();

    socket.emit("leaveRooms");

    this.scene.start(target);
  }

  isPositionBlocked(x: number, y: number): boolean {
    const mapWidthInTiles = 70;
    const mapHeightInTiles = this.obstacles.length / mapWidthInTiles;
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
      tileY >= mapHeightInTiles
    ) {
      return true;
    }
    const index = tileY * mapWidthInTiles + tileX;
    return this.obstacles[index] !== 0;
  }

  obstacles = [
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 1025, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 1025, 1025, 1025, 0, 0, 1025, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 1025, 0, 0, 0, 0, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0,
    0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 1025, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 0, 0, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 1025, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1025, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 0, 0, 0, 0, 0, 0, 1025, 0, 0, 0, 0, 0, 0, 1025, 0, 0, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 0, 0, 1025, 0, 0, 0, 0, 0, 0, 0, 1025, 0, 0, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 1025,
    1025, 1025, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 1025,
    1025, 1025, 0, 0, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 0, 0, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 1025, 0, 0, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1025, 0,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
    1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025,
  ];
}
