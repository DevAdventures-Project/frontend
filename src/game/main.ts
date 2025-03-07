import { AUTO, Game } from "phaser";
import { Boot } from "./scenes/Boot";
import { CozyCity } from "./scenes/CozyCity";
import { Dungeon } from "./scenes/Dungeon";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { Kanojedo } from "./scenes/Kanojedo";
import { MarketplaceScene } from "./scenes/MarketplaceScene";
import { Preloader } from "./scenes/Preloader";
import { ProfileScene } from "./scenes/ProfileScene";
import { Town } from "./scenes/Town";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  scene: [
    Boot,
    Preloader,
    MainGame,
    GameOver,
    Town,
    Dungeon,
    CozyCity,
    Kanojedo,
    MarketplaceScene,
    ProfileScene,
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
