import ChatLayout from "@/components/ChatLayout";
import CreateQuest from "@/components/CreateQuest";
import QuestList from "@/components/QuestList";
import { reactToDom } from "@/lib/reactToDom";
import { type GameObjects, Scene } from "phaser";
import { DialogManager } from "../DialogManager";
import { EventBus } from "../EventBus";
import { Npc } from "../Npc";
import { type MovableScene, Player } from "../Player";

export class Town extends Scene implements MovableScene {
  town: GameObjects.Image;
  title: GameObjects.Text;
  player: GameObjects.Sprite;
  npc: GameObjects.Sprite;
  portal: GameObjects.Image;
  private portalCollider: Phaser.Geom.Circle;
  private npcCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private isOverlapping = false;
  private portalRadius = 20;
  private playerRadius = 10;
  playerMovement: Player;
  dialogManager: DialogManager;
  wizardNpc: Npc;
  private questListDom: Phaser.GameObjects.DOMElement | null = null;
  private createQuestDom: Phaser.GameObjects.DOMElement | null = null;

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

    this.portal = this.add.image(730, 352, "portal");
    this.portal.setScale(0.1);

    this.player = this.add.sprite(410, 390, "player-run");
    this.player.setOrigin(0.5, 0.5);
    this.playerCollider = new Phaser.Geom.Circle(
      this.player.x,
      this.player.y,
      this.playerRadius,
    );

    this.portalCollider = new Phaser.Geom.Circle(
      this.portal.x,
      this.portal.y,
      this.portalRadius,
    );

    this.createAnimations();

    this.player.setOrigin(0.5, 1);

    this.tweens.add({
      targets: this.portal,
      scale: 0.15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.dialogManager = new DialogManager(this);

    EventBus.on(
      "get-dialog-manager",
      (callback: (dialogManager: DialogManager) => void) => {
        if (callback && typeof callback === "function") {
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
        messages: [
          "Salut je suis le goat du C, tu veux voir ou créer une quête de cette zone ?",
        ],
        responses: [
          {
            text: "Voir les quêtes",
            action: () => {
              this.showQuestList();
            },
          },
          {
            text: "Créer une quête",
            action: () => {
              this.showCreateQuest();
            },
          },
        ],
      },
    });

    this.npcCollider = this.wizardNpc.getCollider();

    this.playerMovement = new Player(this);

    EventBus.emit("current-scene-ready", this);
  }

  showQuestList(): void {
    this.cleanupQuestUIs();

    this.questListDom = this.add.dom(850, 100, reactToDom(<QuestList />));
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
      frames: this.anims.generateFrameNumbers("npc-idle", {
        start: 0,
        end: 3,
      }),
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

  checkNpcCollision() {
    const isColliding = Phaser.Geom.Intersects.CircleToCircle(
      this.playerCollider,
      this.npcCollider,
    );

    if (isColliding && !this.isOverlapping) {
      this.isOverlapping = true;
    } else if (!isColliding && this.isOverlapping) {
      this.isOverlapping = false;
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
    if (this.dialogManager.isActive()) return;

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
    this.checkNpcCollision();

    this.wizardNpc.update(this.playerCollider);

    this.playerMovement.update();
  }

  changeScene() {
    this.cleanupQuestUIs();
    this.scene.start("Dungeon");
  }
}
