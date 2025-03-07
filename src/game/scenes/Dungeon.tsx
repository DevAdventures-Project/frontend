import ChatLayout from "@/components/ChatLayout";
import { socket } from "@/contexts/WebSocketContext";
import { reactToDom } from "@/lib/reactToDom";
import { type GameObjects, Scene, type Tilemaps } from "phaser";
import { EventBus } from "../EventBus";
import { type MovableScene, Player } from "../Player";
import {
  calculateOffsets,
  getTileCoordinates,
  getTileIndex,
} from "./GridUtils";

export class Dungeon extends Scene implements MovableScene {
  dungeon: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;
  map: Tilemaps.Tilemap;
  collisionLayer: Phaser.Tilemaps.TilemapLayer;
  portal: GameObjects.Image;
  private portalCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private isOverlapping = false;
  private portalRadius = 20;
  private playerRadius = 10;
  playerMovement: Player;

  // Propriétés de grille pour MovableScene
  tileWidth = 12;
  tileHeight = 12;

  obstacles: number[] = [];
  offsetX = 0;
  offsetY = 0;

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

  create() {
    // Optionnel : Calcul de l'offset pour centrer la grille dans 1024×768.
    const mapWidthInTiles = 50;
    const mapHeightInTiles = 30; // Par exemple
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

    // Affichage du background (ici une image, pas de tilemap)
    this.dungeon = this.add.image(600, 450, "dungeon_tiles").setDepth(0);
    this.title = this.add.text(100, 100, "Dungeon", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    // Création du portail
    this.portal = this.add.image(590, 590, "portal");
    this.portal.setScale(0.1);
    this.portal.setDepth(1);

    // Création du joueur
    this.player = this.add.sprite(410, 390, "player-run");
    this.player.setOrigin(0.5, 0.5);
    this.player.setDepth(2);

    // Création des colliders
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

    // Animations
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

    // Initialisation du mouvement du joueur avec la logique de grid
    this.playerMovement = new Player(this);
    EventBus.emit("current-scene-ready", this);

    this.add.dom(0, 0, reactToDom(<ChatLayout room="Dungeon" />));
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

  // Implémente isPositionBlocked pour la grille Dungeon.
  // Ici, on retourne toujours false si obstacles est vide.
  isPositionBlocked(x: number, y: number): boolean {
    if (this.obstacles.length === 0) {
      return false;
    }
    const mapWidthInTiles = 50;
    const { tileX, tileY } = getTileCoordinates(
      x,
      y,
      this.tileWidth,
      this.tileHeight,
      this.offsetX,
      this.offsetY,
    );
    // Vérifier les limites
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
}
