import { type GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Town extends Scene {
  town: GameObjects.Image;
  title: GameObjects.Text;

  constructor() {
    super("Town");
  }

  preload() {
    // Load the assets
    console.log("Town preload");

    // this.game.load.tilemap('MyTilemap', '/images/maps/firstMap.json', null, Phaser.Tilemap.TILED_JSON);
    // this.game.load.image('tiles', '/images/terrain_atlas.png');

    this.load.image("tiles", "assets/tilemaps/tiles/town.png");
    this.load.tilemapTiledJSON("town", "assets/tilemaps/json/town.json");
  }

  create() {
    this.town = this.add.image(512, 384, "town").setDepth(0);
    this.title = this.add
    .text(100, 100, "The Hub", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    })

    EventBus.emit("current-scene-ready", this);
  }

  changeScene() {
    this.scene.start("MainMenu");
  }
}
