import { AUTO, Game } from "phaser";
import { Boot } from "./scenes/Boot";
import { CozyCity } from "./scenes/CozyCity";
import { Dungeon } from "./scenes/Dungeon";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { Kanojedo } from "./scenes/Kanojedo";
import { MainMenu } from "./scenes/MainMenu";
import { MarketplaceScene } from "./scenes/MarketplaceScene";
import { Preloader } from "./scenes/Preloader";
import { Town } from "./scenes/Town";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  scene: [
    Boot,
    Preloader,
    MainMenu,
    MainGame,
    GameOver,
    Town,
    Dungeon,
    CozyCity,
    Kanojedo,
    MarketplaceScene,
  ],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  dom: {
    createContainer: true,
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
