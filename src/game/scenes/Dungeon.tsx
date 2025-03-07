import ChatLayout from "@/components/ChatLayout";
import { socket } from "@/contexts/WebSocketContext";
import { reactToDom } from "@/lib/reactToDom";
import type { UserChat } from "@/models/User";
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
  otherPlayersPositions = new Map<number, { x: number; y: number }>();
  private portalCollider: Phaser.Geom.Circle;
  private playerCollider: Phaser.Geom.Circle;
  private isOverlapping = false;
  private portalRadius = 20;
  private playerRadius = 10;
  playerMovement: Player;
  debugDot: GameObjects.Graphics;
  obstaclesDebugGraphics: GameObjects.Graphics;

  // Propriétés de grille pour MovableScene
  tileWidth = 12;
  tileHeight = 12;

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
  offsetX = 0;
  offsetY = 0;

  constructor() {
    super("Dungeon");
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
  }

  create() {
    // Affichage du background (ici une image, pas un tilemap)
    this.dungeon = this.add.image(512, 384, "dungeon_tiles").setDepth(0);
    this.title = this.add.text(100, 100, "Dungeon", {
      fontFamily: "Arial Black",
      fontSize: 38,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    });

    // Calcul de l'offset pour centrer la grille dans une fenêtre de 1024x768
    const mapWidthInTiles = 85;
    const mapHeightInTiles = 64; // Exemple : 30 lignes
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
    for (let i = 0; i < this.obstacles.length; i++) {
      if (this.obstacles[i] !== 0) {
        const tileX = i % mapWidthInTiles;
        const tileY = Math.floor(i / mapWidthInTiles);
        const dotX = offsetX + tileX * this.tileWidth + this.tileWidth / 2;
        const dotY = offsetY + tileY * this.tileHeight + this.tileHeight / 2;
        this.obstaclesDebugGraphics.fillStyle(0x00ff00, 1);
        this.obstaclesDebugGraphics.fillCircle(dotX, dotY, 3);
      }
    }

    // Création du portail
    this.portal = this.add.image(770, 280, "portal");
    this.portal.setScale(0.1);
    this.portal.setDepth(1);

    // Création du joueur
    this.player = this.add.sprite(200, 660, "player-run");
    this.player.setOrigin(0.5, 0.5);
    this.player.setScale(2);
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

    // Création des animations
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

    // Initialisation du mouvement du joueur avec la logique de grille
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

  // Implémente isPositionBlocked pour la grille Dungeon.
  // Retourne false si obstacles est vide.
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
}
