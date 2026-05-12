import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, Zap, Droplet, Flame, Leaf, Shield, Target, MapPin, Backpack, Award, ArrowLeft, Sparkles, Navigation, ShoppingBag, Ghost, Eye, Crown } from 'lucide-react';
import { audioSystem } from '../lib/audio';

type ElementType = 'FIRE' | 'WATER' | 'GRASS' | 'ELECTRIC' | 'NORMAL' | 'ROCK' | 'PSYCHIC' | 'GHOST' | 'DRAGON' | 'BUG' | 'FLYING' | 'STEEL' | 'POISON' | 'ICE' | 'DARK' | 'FAIRY' | 'GROUND';

type StatusType = 'BURN' | 'POISON' | 'PARALYSIS' | 'SLEEP' | 'FREEZE' | 'CONFUSION' | null;

interface Move {
  id: string;
  name: string;
  type: ElementType;
  power: number;
  accuracy: number;
  statusEffect?: StatusType;
  statusChance?: number;
  isStatusOnly?: boolean;
}

interface MonsterData {
  id: string;
  name: string;
  emoji: string;
  type: ElementType;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  possibleMoves: string[];
  color: string;
  evolveAt?: number;
  evolveTo?: string;
}

interface MonsterInstance {
  uid: string;
  dataId: string;
  name: string;
  emoji: string;
  type: ElementType;
  level: number;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: Move[];
  color: string;
  isShiny: boolean;
  xp: number;
  maxXp: number;
  gender: 'MALE' | 'FEMALE' | 'GENDERLESS';
  ivs: { hp: number, attack: number, defense: number, speed: number };
  status: StatusType;
  sleepTurns: number;
}

const ELEMENT_COLORS: Record<ElementType, string> = {
  FIRE: 'bg-rose-500',
  WATER: 'bg-blue-500',
  GRASS: 'bg-emerald-500',
  ELECTRIC: 'bg-amber-400',
  NORMAL: 'bg-stone-400',
  ROCK: 'bg-stone-600',
  PSYCHIC: 'bg-purple-500',
  GHOST: 'bg-indigo-600',
  DRAGON: 'bg-indigo-800',
  BUG: 'bg-lime-500',
  FLYING: 'bg-sky-400',
  STEEL: 'bg-slate-400',
  POISON: 'bg-fuchsia-500',
  ICE: 'bg-cyan-300',
  DARK: 'bg-zinc-800',
  FAIRY: 'bg-pink-400',
  GROUND: 'bg-amber-600',
};

const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  FIRE: <Flame size={14} />,
  WATER: <Droplet size={14} />,
  GRASS: <Leaf size={14} />,
  ELECTRIC: <Zap size={14} />,
  NORMAL: <Target size={14} />,
  ROCK: <MapPin size={14} />,
  PSYCHIC: <Eye size={14} />,
  GHOST: <Ghost size={14} />,
  DRAGON: <Crown size={14} />,
  BUG: <Ghost size={14} />,
  FLYING: <Navigation size={14} />,
  STEEL: <Shield size={14} />,
  POISON: <Activity size={14} />,
  ICE: <Sparkles size={14} />,
  DARK: <Ghost size={14} />,
  FAIRY: <Heart size={14} />,
  GROUND: <MapPin size={14} />,
};

const TYPE_MULTIPLIERS: Record<ElementType, Record<ElementType, number>> = {
  FIRE: { FIRE: 0.5, WATER: 0.5, GRASS: 2.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 0.5, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 0.5, BUG: 2.0, FLYING: 1.0, STEEL: 2.0, POISON: 1.0, ICE: 2.0, DARK: 1.0, FAIRY: 1.0, GROUND: 1.0 },
  WATER: { FIRE: 2.0, WATER: 0.5, GRASS: 0.5, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 2.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 0.5, BUG: 1.0, FLYING: 1.0, STEEL: 1.0, POISON: 1.0, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 2.0 },
  GRASS: { FIRE: 0.5, WATER: 2.0, GRASS: 0.5, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 2.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 0.5, BUG: 0.5, FLYING: 0.5, STEEL: 0.5, POISON: 0.5, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 2.0 },
  ELECTRIC: { FIRE: 1.0, WATER: 2.0, GRASS: 0.5, ELECTRIC: 0.5, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 0.5, BUG: 1.0, FLYING: 2.0, STEEL: 1.0, POISON: 1.0, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 0.0 },
  NORMAL: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 0.5, PSYCHIC: 1.0, GHOST: 0.0, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.5, POISON: 1.0, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 1.0 },
  ROCK: { FIRE: 2.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 1.0, BUG: 2.0, FLYING: 2.0, STEEL: 0.5, POISON: 1.0, ICE: 2.0, DARK: 1.0, FAIRY: 1.0, GROUND: 0.5 },
  PSYCHIC: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 0.5, GHOST: 1.0, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.5, POISON: 2.0, ICE: 1.0, DARK: 0.0, FAIRY: 1.0, GROUND: 1.0 },
  GHOST: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 0.0, ROCK: 1.0, PSYCHIC: 2.0, GHOST: 2.0, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 1.0, POISON: 1.0, ICE: 1.0, DARK: 0.5, FAIRY: 1.0, GROUND: 1.0 },
  DRAGON: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 2.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.5, POISON: 1.0, ICE: 1.0, DARK: 1.0, FAIRY: 0.0, GROUND: 1.0 },
  BUG: { FIRE: 0.5, WATER: 1.0, GRASS: 2.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 2.0, GHOST: 0.5, DRAGON: 1.0, BUG: 1.0, FLYING: 0.5, STEEL: 0.5, POISON: 0.5, ICE: 1.0, DARK: 2.0, FAIRY: 0.5, GROUND: 1.0 },
  FLYING: { FIRE: 1.0, WATER: 1.0, GRASS: 2.0, ELECTRIC: 0.5, NORMAL: 1.0, ROCK: 0.5, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 1.0, BUG: 2.0, FLYING: 1.0, STEEL: 0.5, POISON: 1.0, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 1.0 },
  STEEL: { FIRE: 0.5, WATER: 0.5, GRASS: 1.0, ELECTRIC: 0.5, NORMAL: 1.0, ROCK: 2.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.5, POISON: 0.0, ICE: 2.0, DARK: 1.0, FAIRY: 2.0, GROUND: 1.0 },
  POISON: { FIRE: 1.0, WATER: 1.0, GRASS: 2.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 0.5, PSYCHIC: 1.0, GHOST: 0.5, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.0, POISON: 0.5, ICE: 1.0, DARK: 1.0, FAIRY: 2.0, GROUND: 0.5 },
  ICE: { FIRE: 0.5, WATER: 0.5, GRASS: 2.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 2.0, BUG: 1.0, FLYING: 2.0, STEEL: 0.5, POISON: 1.0, ICE: 0.5, DARK: 1.0, FAIRY: 1.0, GROUND: 2.0 },
  DARK: { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 2.0, GHOST: 2.0, DRAGON: 1.0, BUG: 1.0, FLYING: 1.0, STEEL: 1.0, POISON: 1.0, ICE: 1.0, DARK: 0.5, FAIRY: 0.5, GROUND: 1.0 },
  FAIRY: { FIRE: 0.5, WATER: 1.0, GRASS: 1.0, ELECTRIC: 1.0, NORMAL: 1.0, ROCK: 1.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 2.0, BUG: 1.0, FLYING: 1.0, STEEL: 0.5, POISON: 0.5, ICE: 1.0, DARK: 2.0, FAIRY: 1.0, GROUND: 1.0 },
  GROUND: { FIRE: 2.0, WATER: 1.0, GRASS: 0.5, ELECTRIC: 2.0, NORMAL: 1.0, ROCK: 2.0, PSYCHIC: 1.0, GHOST: 1.0, DRAGON: 1.0, BUG: 0.5, FLYING: 0.0, STEEL: 2.0, POISON: 2.0, ICE: 1.0, DARK: 1.0, FAIRY: 1.0, GROUND: 1.0 },
};

const MOVES: Record<string, Move> = {
  tackle: { id: 'tackle', name: 'Investida', type: 'NORMAL', power: 40, accuracy: 100 },
  ember: { id: 'ember', name: 'Brasa', type: 'FIRE', power: 40, accuracy: 100, statusEffect: 'BURN', statusChance: 0.1 },
  water_gun: { id: 'water_gun', name: "Jato d'Água", type: 'WATER', power: 40, accuracy: 100 },
  vine_whip: { id: 'vine_whip', name: 'Chicote de Vinha', type: 'GRASS', power: 45, accuracy: 100 },
  thunder_shock: { id: 'thunder_shock', name: 'Choque do Trovão', type: 'ELECTRIC', power: 40, accuracy: 100, statusEffect: 'PARALYSIS', statusChance: 0.1 },
  rock_throw: { id: 'rock_throw', name: 'Lançar Rocha', type: 'ROCK', power: 50, accuracy: 90 },
  flamethrower: { id: 'flamethrower', name: 'Lança-Chamas', type: 'FIRE', power: 90, accuracy: 100, statusEffect: 'BURN', statusChance: 0.1 },
  fire_blast: { id: 'fire_blast', name: 'Explosão de Fogo', type: 'FIRE', power: 110, accuracy: 85, statusEffect: 'BURN', statusChance: 0.3 },
  hydro_pump: { id: 'hydro_pump', name: 'Hidro Bomba', type: 'WATER', power: 110, accuracy: 80 },
  surf: { id: 'surf', name: 'Surfar', type: 'WATER', power: 90, accuracy: 100 },
  solar_beam: { id: 'solar_beam', name: 'Raio Solar', type: 'GRASS', power: 120, accuracy: 90 },
  leaf_storm: { id: 'leaf_storm', name: 'Tempestade de Folhas', type: 'GRASS', power: 130, accuracy: 90 },
  quick_attack: { id: 'quick_attack', name: 'Ataque Rápido', type: 'NORMAL', power: 40, accuracy: 100 },
  hyper_beam: { id: 'hyper_beam', name: 'Hiper Raio', type: 'NORMAL', power: 150, accuracy: 90 },
  earthquake: { id: 'earthquake', name: 'Terremoto', type: 'GROUND', power: 100, accuracy: 100 },
  thunderbolt: { id: 'thunderbolt', name: 'Relâmpago', type: 'ELECTRIC', power: 90, accuracy: 100, statusEffect: 'PARALYSIS', statusChance: 0.1 },
  thunder: { id: 'thunder', name: 'Trovão', type: 'ELECTRIC', power: 110, accuracy: 70, statusEffect: 'PARALYSIS', statusChance: 0.3 },
  psybeam: { id: 'psybeam', name: 'Raio Psíquico', type: 'PSYCHIC', power: 65, accuracy: 100, statusEffect: 'CONFUSION', statusChance: 0.1 },
  psychic: { id: 'psychic', name: 'Psíquico', type: 'PSYCHIC', power: 90, accuracy: 100 },
  shadow_ball: { id: 'shadow_ball', name: 'Bola Sombria', type: 'GHOST', power: 80, accuracy: 100 },
  lick: { id: 'lick', name: 'Lambida', type: 'GHOST', power: 30, accuracy: 100, statusEffect: 'PARALYSIS', statusChance: 0.3 },
  dragon_breath: { id: 'dragon_breath', name: 'Sopro do Dragão', type: 'DRAGON', power: 60, accuracy: 100, statusEffect: 'PARALYSIS', statusChance: 0.3 },
  dragon_claw: { id: 'dragon_claw', name: 'Garra do Dragão', type: 'DRAGON', power: 80, accuracy: 100 },
  gust: { id: 'gust', name: 'Rajada de Vento', type: 'FLYING', power: 40, accuracy: 100 },
  fly_attack: { id: 'fly_attack', name: 'Ataque Aéreo', type: 'FLYING', power: 70, accuracy: 95 },
  metal_claw: { id: 'metal_claw', name: 'Garra de Metal', type: 'STEEL', power: 50, accuracy: 95 },
  iron_tail: { id: 'iron_tail', name: 'Cauda de Ferro', type: 'STEEL', power: 100, accuracy: 75 },
  bug_bite: { id: 'bug_bite', name: 'Picada de Inseto', type: 'BUG', power: 60, accuracy: 100 },
  x_scissor: { id: 'x_scissor', name: 'Tesoura-X', type: 'BUG', power: 80, accuracy: 100 },
  poison_sting: { id: 'poison_sting', name: 'Picada Venenosa', type: 'POISON', power: 15, accuracy: 100, statusEffect: 'POISON', statusChance: 0.3 },
  toxic: { id: 'toxic', name: 'Tóxico', type: 'POISON', power: 0, accuracy: 90, statusEffect: 'POISON', statusChance: 1, isStatusOnly: true },
  sleep_powder: { id: 'sleep_powder', name: 'Pó do Sono', type: 'GRASS', power: 0, accuracy: 75, statusEffect: 'SLEEP', statusChance: 1, isStatusOnly: true },
  ice_beam: { id: 'ice_beam', name: 'Raio de Gelo', type: 'ICE', power: 90, accuracy: 100, statusEffect: 'FREEZE', statusChance: 0.1 },
  bite: { id: 'bite', name: 'Mordida', type: 'DARK', power: 60, accuracy: 100 },
  play_rough: { id: 'play_rough', name: 'Jogo Duro', type: 'FAIRY', power: 90, accuracy: 90 },
};

const MONSTERS_DB: Record<string, MonsterData> = {
  ignis: { id: 'ignis', name: 'Ignis', emoji: '🦊', type: 'FIRE', baseHp: 45, baseAtk: 60, baseDef: 40, baseSpd: 60, possibleMoves: ['tackle', 'ember'], color: 'from-rose-400 to-rose-600', evolveAt: 16, evolveTo: 'inferno' },
  inferno: { id: 'inferno', name: 'Inferno', emoji: '🐺', type: 'FIRE', baseHp: 65, baseAtk: 80, baseDef: 60, baseSpd: 80, possibleMoves: ['tackle', 'quick_attack', 'ember', 'flamethrower'], color: 'from-orange-500 to-rose-600', evolveAt: 36, evolveTo: 'vulcan' },
  vulcan: { id: 'vulcan', name: 'Vulcan', emoji: '🐉', type: 'FIRE', baseHp: 85, baseAtk: 110, baseDef: 80, baseSpd: 100, possibleMoves: ['quick_attack', 'flamethrower', 'fire_blast'], color: 'from-red-600 to-orange-600' },
  
  aqua: { id: 'aqua', name: 'Aqua', emoji: '🐢', type: 'WATER', baseHp: 50, baseAtk: 45, baseDef: 65, baseSpd: 40, possibleMoves: ['tackle', 'water_gun'], color: 'from-blue-400 to-blue-600', evolveAt: 16, evolveTo: 'hydro' },
  hydro: { id: 'hydro', name: 'Hydro', emoji: '🦦', type: 'WATER', baseHp: 70, baseAtk: 65, baseDef: 85, baseSpd: 60, possibleMoves: ['tackle', 'water_gun', 'surf'], color: 'from-cyan-500 to-blue-600', evolveAt: 36, evolveTo: 'tsunami' },
  tsunami: { id: 'tsunami', name: 'Tsunami', emoji: '🐋', type: 'WATER', baseHp: 90, baseAtk: 85, baseDef: 105, baseSpd: 80, possibleMoves: ['water_gun', 'surf', 'hydro_pump'], color: 'from-blue-600 to-indigo-600' },

  terra: { id: 'terra', name: 'Terra', emoji: '🦕', type: 'GRASS', baseHp: 55, baseAtk: 55, baseDef: 55, baseSpd: 45, possibleMoves: ['tackle', 'vine_whip'], color: 'from-emerald-400 to-emerald-600', evolveAt: 16, evolveTo: 'silva' },
  silva: { id: 'silva', name: 'Silva', emoji: '🦖', type: 'GRASS', baseHp: 75, baseAtk: 75, baseDef: 75, baseSpd: 65, possibleMoves: ['tackle', 'vine_whip', 'solar_beam'], color: 'from-green-500 to-emerald-600', evolveAt: 36, evolveTo: 'gaia' },
  gaia: { id: 'gaia', name: 'Gaia', emoji: '🐊', type: 'GRASS', baseHp: 95, baseAtk: 95, baseDef: 95, baseSpd: 85, possibleMoves: ['vine_whip', 'solar_beam', 'leaf_storm'], color: 'from-emerald-600 to-green-700' },

  spark: { id: 'spark', name: 'Spark', emoji: '⚡', type: 'ELECTRIC', baseHp: 40, baseAtk: 65, baseDef: 40, baseSpd: 70, possibleMoves: ['tackle', 'thunder_shock'], color: 'from-amber-300 to-amber-500', evolveAt: 20, evolveTo: 'blitz' },
  blitz: { id: 'blitz', name: 'Blitz', emoji: '🐆', type: 'ELECTRIC', baseHp: 65, baseAtk: 95, baseDef: 60, baseSpd: 110, possibleMoves: ['quick_attack', 'thunder_shock', 'thunderbolt'], color: 'from-yellow-400 to-amber-600', evolveAt: 40, evolveTo: 'zeus' },
  zeus: { id: 'zeus', name: 'Zeus', emoji: '🌩️', type: 'ELECTRIC', baseHp: 85, baseAtk: 120, baseDef: 80, baseSpd: 130, possibleMoves: ['quick_attack', 'thunderbolt', 'thunder'], color: 'from-amber-500 to-yellow-600' },

  pidge: { id: 'pidge', name: 'Pidge', emoji: '🐦', type: 'NORMAL', baseHp: 40, baseAtk: 45, baseDef: 40, baseSpd: 65, possibleMoves: ['tackle', 'quick_attack'], color: 'from-stone-300 to-stone-500', evolveAt: 18, evolveTo: 'falcon' },
  falcon: { id: 'falcon', name: 'Falcon', emoji: '🦅', type: 'NORMAL', baseHp: 70, baseAtk: 80, baseDef: 70, baseSpd: 100, possibleMoves: ['quick_attack', 'hyper_beam'], color: 'from-stone-400 to-stone-600' },

  roco: { id: 'roco', name: 'Roco', emoji: '🪨', type: 'ROCK', baseHp: 60, baseAtk: 60, baseDef: 70, baseSpd: 30, possibleMoves: ['tackle', 'rock_throw'], color: 'from-stone-500 to-stone-700', evolveAt: 22, evolveTo: 'titan' },
  titan: { id: 'titan', name: 'Titan', emoji: '🗿', type: 'ROCK', baseHp: 90, baseAtk: 100, baseDef: 110, baseSpd: 50, possibleMoves: ['rock_throw', 'earthquake'], color: 'from-stone-600 to-stone-800' },
  
  mindy: { id: 'mindy', name: 'Mindy', emoji: '👁️', type: 'PSYCHIC', baseHp: 40, baseAtk: 30, baseDef: 30, baseSpd: 50, possibleMoves: ['tackle', 'psybeam'], color: 'from-purple-400 to-purple-600', evolveAt: 20, evolveTo: 'brainy' },
  brainy: { id: 'brainy', name: 'Brainy', emoji: '🧠', type: 'PSYCHIC', baseHp: 70, baseAtk: 50, baseDef: 50, baseSpd: 80, possibleMoves: ['psybeam', 'psychic'], color: 'from-purple-500 to-purple-800' },

  spooky: { id: 'spooky', name: 'Spooky', emoji: '👻', type: 'GHOST', baseHp: 45, baseAtk: 40, baseDef: 35, baseSpd: 60, possibleMoves: ['lick', 'shadow_ball'], color: 'from-indigo-400 to-indigo-600', evolveAt: 25, evolveTo: 'phantom' },
  phantom: { id: 'phantom', name: 'Phantom', emoji: '👺', type: 'GHOST', baseHp: 80, baseAtk: 70, baseDef: 60, baseSpd: 90, possibleMoves: ['lick', 'shadow_ball'], color: 'from-indigo-600 to-violet-900' },

  drake: { id: 'drake', name: 'Drake', emoji: '🦎', type: 'DRAGON', baseHp: 50, baseAtk: 70, baseDef: 50, baseSpd: 50, possibleMoves: ['tackle', 'dragon_breath'], color: 'from-indigo-600 to-blue-800', evolveAt: 30, evolveTo: 'wyvern' },
  wyvern: { id: 'wyvern', name: 'Wyvern', emoji: '🐉', type: 'DRAGON', baseHp: 90, baseAtk: 100, baseDef: 80, baseSpd: 80, possibleMoves: ['dragon_breath', 'dragon_claw', 'earthquake'], color: 'from-blue-800 to-indigo-900' },
  
  ratkin: { id: 'ratkin', name: 'Ratkin', emoji: '🐀', type: 'NORMAL', baseHp: 30, baseAtk: 45, baseDef: 30, baseSpd: 50, possibleMoves: ['tackle', 'quick_attack'], color: 'from-stone-300 to-stone-400' },
  pidgeon: { id: 'pidgeon', name: 'Pidgeon', emoji: '🕊️', type: 'FLYING', baseHp: 40, baseAtk: 45, baseDef: 40, baseSpd: 65, possibleMoves: ['tackle', 'gust', 'quick_attack'], color: 'from-sky-300 to-sky-500', evolveAt: 18, evolveTo: 'raptor' },
  raptor: { id: 'raptor', name: 'Raptor', emoji: '🦅', type: 'FLYING', baseHp: 75, baseAtk: 85, baseDef: 60, baseSpd: 110, possibleMoves: ['gust', 'quick_attack', 'fly_attack'], color: 'from-sky-500 to-sky-700' },
  mechabot: { id: 'mechabot', name: 'Mechabot', emoji: '🤖', type: 'STEEL', baseHp: 65, baseAtk: 60, baseDef: 100, baseSpd: 30, possibleMoves: ['tackle', 'metal_claw'], color: 'from-slate-400 to-slate-600', evolveAt: 35, evolveTo: 'titansteel' },
  titansteel: { id: 'titansteel', name: 'Titansteel', emoji: '🏭', type: 'STEEL', baseHp: 85, baseAtk: 95, baseDef: 140, baseSpd: 40, possibleMoves: ['metal_claw', 'iron_tail', 'earthquake'], color: 'from-slate-600 to-slate-800' },
  mightyant: { id: 'mightyant', name: 'MightyAnt', emoji: '🐜', type: 'BUG', baseHp: 45, baseAtk: 45, baseDef: 50, baseSpd: 45, possibleMoves: ['tackle', 'bug_bite'], color: 'from-lime-400 to-lime-600', evolveAt: 24, evolveTo: 'kingant' },
  kingant: { id: 'kingant', name: 'KingAnt', emoji: '🪲', type: 'BUG', baseHp: 70, baseAtk: 105, baseDef: 75, baseSpd: 85, possibleMoves: ['bug_bite', 'x_scissor', 'earthquake'], color: 'from-lime-600 to-green-800' },
  
  frosty: { id: 'frosty', name: 'Frosty', emoji: '⛄', type: 'ICE', baseHp: 55, baseAtk: 65, baseDef: 55, baseSpd: 45, possibleMoves: ['tackle', 'ice_beam'], color: 'from-cyan-300 to-blue-400', evolveAt: 28, evolveTo: 'glacius' },
  glacius: { id: 'glacius', name: 'Glacius', emoji: '🧊', type: 'ICE', baseHp: 85, baseAtk: 95, baseDef: 85, baseSpd: 70, possibleMoves: ['ice_beam', 'surf', 'hyper_beam'], color: 'from-cyan-500 to-blue-600' },
  
  toxik: { id: 'toxik', name: 'Toxik', emoji: '🦠', type: 'POISON', baseHp: 50, baseAtk: 60, baseDef: 50, baseSpd: 65, possibleMoves: ['poison_sting', 'toxic'], color: 'from-fuchsia-400 to-purple-600', evolveAt: 26, evolveTo: 'venom' },
  venom: { id: 'venom', name: 'Venom', emoji: '🐍', type: 'POISON', baseHp: 80, baseAtk: 90, baseDef: 75, baseSpd: 100, possibleMoves: ['poison_sting', 'toxic', 'bite'], color: 'from-fuchsia-600 to-purple-800' },
  
  shadowcat: { id: 'shadowcat', name: 'Shadowcat', emoji: '🐈‍⬛', type: 'DARK', baseHp: 45, baseAtk: 85, baseDef: 45, baseSpd: 100, possibleMoves: ['tackle', 'bite'], color: 'from-zinc-600 to-zinc-900', evolveAt: 30, evolveTo: 'nightmare' },
  nightmare: { id: 'nightmare', name: 'Nightmare', emoji: '🐆', type: 'DARK', baseHp: 75, baseAtk: 115, baseDef: 65, baseSpd: 130, possibleMoves: ['bite', 'shadow_ball'], color: 'from-zinc-800 to-black' },
  
  pixie: { id: 'pixie', name: 'Pixie', emoji: '🧚', type: 'FAIRY', baseHp: 65, baseAtk: 45, baseDef: 65, baseSpd: 45, possibleMoves: ['tackle', 'play_rough'], color: 'from-pink-300 to-pink-500' },
};

function generateMonster(dataId: string, level: number): MonsterInstance {
  const data = MONSTERS_DB[dataId];
  const isShiny = Math.random() < 0.05; // 5% chance shiny
  
  const ivs = {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };
  
  const hp = Math.floor( ((2 * data.baseHp + ivs.hp) * level) / 100 ) + level + 10;
  
  const genderType = Math.random();
  const gender = genderType < 0.05 ? 'GENDERLESS' : genderType < 0.52 ? 'MALE' : 'FEMALE';
  
  return {
    uid: Math.random().toString(36).substring(7),
    dataId,
    name: data.name,
    emoji: data.emoji,
    type: data.type,
    level,
    maxHp: hp,
    hp: hp,
    attack: Math.floor( ((2 * data.baseAtk + ivs.attack) * level) / 100 ) + 5,
    defense: Math.floor( ((2 * data.baseDef + ivs.defense) * level) / 100 ) + 5,
    speed: Math.floor( ((2 * data.baseSpd + ivs.speed) * level) / 100 ) + 5,
    moves: data.possibleMoves.slice(0, 4).map(m => MOVES[m]),
    color: isShiny ? 'from-purple-400 to-fuchsia-600' : data.color,
    isShiny,
    xp: 0,
    maxXp: level * 100,
    gender,
    ivs,
    status: null,
    sleepTurns: 0,
  };
}

interface GymLeader {
  name: string;
  badge: string;
  team: MonsterInstance[];
  rewardMessage: string;
}

interface LocationInfo {
  id: string;
  name: string;
  type: 'CITY' | 'ROUTE' | 'GYM';
  description: string;
  connections: string[];
  encounters?: { id: string; minLvl: number; maxLvl: number; chance: number }[];
  gymLeader?: GymLeader;
}

const WORLD: Record<string, LocationInfo> = {
  'TOWN_START': {
    id: 'TOWN_START', name: 'Vila Inicial', type: 'CITY', description: 'Uma vila calma onde jornadas começam.',
    connections: ['ROUTE_1']
  },
  'ROUTE_1': {
    id: 'ROUTE_1', name: 'Rota 1', type: 'ROUTE', description: 'Caminho arborizado com monstros de baixo nível.',
    connections: ['TOWN_START', 'TOWN_ROCK'],
    encounters: [
      { id: 'pidgeon', minLvl: 2, maxLvl: 3, chance: 0.3 },
      { id: 'ratkin', minLvl: 2, maxLvl: 3, chance: 0.3 },
      { id: 'mightyant', minLvl: 2, maxLvl: 4, chance: 0.2 },
      { id: 'terra', minLvl: 2, maxLvl: 4, chance: 0.1 },
      { id: 'spark', minLvl: 2, maxLvl: 4, chance: 0.1 },
    ]
  },
  'TOWN_ROCK': {
    id: 'TOWN_ROCK', name: 'Cidade de Pedra', type: 'CITY', description: 'Cidade construída nas montanhas. Casa do Ginásio de Pedra.',
    connections: ['ROUTE_1', 'GYM_ROCK', 'ROUTE_2']
  },
  'GYM_ROCK': {
    id: 'GYM_ROCK', name: 'Ginásio de Pedra', type: 'GYM', description: 'O líder Brocky aguarda.',
    connections: ['TOWN_ROCK'],
    gymLeader: {
      name: 'Líder Brocky', badge: 'Insígnia Rocha', rewardMessage: 'Você me derrotou! Leve a Insígnia Rocha.',
      team: [generateMonster('roco', 8), generateMonster('mechabot', 10)]
    }
  },
  'ROUTE_2': {
    id: 'ROUTE_2', name: 'Rota 2', type: 'ROUTE', description: 'Caminho perigoso cheio de pedras e rios.',
    connections: ['TOWN_ROCK', 'TOWN_WATER'],
    encounters: [
      { id: 'aqua', minLvl: 6, maxLvl: 10, chance: 0.3 },
      { id: 'roco', minLvl: 6, maxLvl: 10, chance: 0.3 },
      { id: 'ratkin', minLvl: 5, maxLvl: 8, chance: 0.2 },
      { id: 'toxik', minLvl: 6, maxLvl: 9, chance: 0.2 }
    ]
  },
  'TOWN_WATER': {
    id: 'TOWN_WATER', name: 'Cidade das Águas', type: 'CITY', description: 'Cidade litorânea com uma brisa suave.',
    connections: ['ROUTE_2', 'GYM_WATER', 'ROUTE_3']
  },
  'GYM_WATER': {
    id: 'GYM_WATER', name: 'Ginásio de Água', type: 'GYM', description: 'A líder Misty aguarda nos canais.',
    connections: ['TOWN_WATER'],
    gymLeader: {
      name: 'Líder Misty', badge: 'Insígnia Cascata', rewardMessage: 'Foi uma batalha fluida! Aqui está sua Insígnia Cascata.',
      team: [generateMonster('aqua', 12), generateMonster('frosty', 14), generateMonster('hydro', 15)]
    }
  },
  'ROUTE_3': {
    id: 'ROUTE_3', name: 'Rota 3', type: 'ROUTE', description: 'Uma floresta densa com clima instável.',
    connections: ['TOWN_WATER', 'TOWN_ELEC'],
    encounters: [
      { id: 'spark', minLvl: 12, maxLvl: 16, chance: 0.25 },
      { id: 'pidge', minLvl: 10, maxLvl: 14, chance: 0.25 },
      { id: 'terra', minLvl: 12, maxLvl: 15, chance: 0.25 },
      { id: 'pixie', minLvl: 12, maxLvl: 15, chance: 0.25 }
    ]
  },
  'TOWN_ELEC': {
    id: 'TOWN_ELEC', name: 'Cidade Voltagem', type: 'CITY', description: 'Uma cidade cheia de luzes e tecnologia.',
    connections: ['ROUTE_3', 'GYM_ELEC', 'ROUTE_4']
  },
  'GYM_ELEC': {
    id: 'GYM_ELEC', name: 'Ginásio Elétrico', type: 'GYM', description: 'O líder Wattson te aguarda com faíscas.',
    connections: ['TOWN_ELEC'],
    gymLeader: {
      name: 'Líder Wattson', badge: 'Insígnia Trovão', rewardMessage: 'Chocante! Que batalha eletrizante. Pegue a Insígnia Trovão.',
      team: [generateMonster('spark', 18), generateMonster('mechabot', 20), generateMonster('blitz', 22)]
    }
  },
  'ROUTE_4': {
    id: 'ROUTE_4', name: 'Trilha do Vulcão', type: 'ROUTE', description: 'O calor é insuportável aqui.',
    connections: ['TOWN_ELEC', 'TOWN_FIRE'],
    encounters: [
      { id: 'ignis', minLvl: 18, maxLvl: 22, chance: 0.5 },
      { id: 'roco', minLvl: 18, maxLvl: 22, chance: 0.5 }
    ]
  },
  'TOWN_FIRE': {
    id: 'TOWN_FIRE', name: 'Vila da Cratera', type: 'CITY', description: 'Uma vila muito quente próxima de um vulcão ativo.',
    connections: ['ROUTE_4', 'GYM_FIRE', 'ROUTE_5']
  },
  'GYM_FIRE': {
    id: 'GYM_FIRE', name: 'Ginásio de Fogo', type: 'GYM', description: 'A líder Flannery ferve de paixão por batalhas.',
    connections: ['TOWN_FIRE'],
    gymLeader: {
      name: 'Líder Flannery', badge: 'Insígnia Vulcão', rewardMessage: 'Você me apagou! Leve a Insígnia Vulcão.',
      team: [generateMonster('ignis', 24), generateMonster('inferno', 28)]
    }
  },
  'ROUTE_5': {
    id: 'ROUTE_5', name: 'Planície Mística', type: 'ROUTE', description: 'Uma área cheia de neblina e coisas flutuantes.',
    connections: ['TOWN_FIRE', 'TOWN_PSY'],
    encounters: [
      { id: 'mindy', minLvl: 22, maxLvl: 26, chance: 0.3 },
      { id: 'spook', minLvl: 24, maxLvl: 28, chance: 0.3 },
      { id: 'toxik', minLvl: 22, maxLvl: 27, chance: 0.2 },
      { id: 'pixie', minLvl: 25, maxLvl: 28, chance: 0.2 }
    ]
  },
  'TOWN_PSY': {
    id: 'TOWN_PSY', name: 'Cidade Psíquica', type: 'CITY', description: 'Os habitantes se comunicam telepaticamente.',
    connections: ['ROUTE_5', 'GYM_PSY', 'ROUTE_6']
  },
  'GYM_PSY': {
    id: 'GYM_PSY', name: 'Ginásio da Mente', type: 'GYM', description: 'A líder Sabrina espera por você.',
    connections: ['TOWN_PSY'],
    gymLeader: {
      name: 'Líder Sabrina', badge: 'Insígnia Mente', rewardMessage: 'Nossas mentes entraram em colapso. Pegue a insígnia.',
      team: [generateMonster('brainy', 33), generateMonster('venom', 35)]
    }
  },
  'ROUTE_6': {
    id: 'ROUTE_6', name: 'Planícies Nevadas', type: 'ROUTE', description: 'Um vale gelado onde criaturas das sombras rondam.',
    connections: ['TOWN_PSY', 'TOWN_DRAGON'],
    encounters: [
      { id: 'drake', minLvl: 28, maxLvl: 32, chance: 0.4 },
      { id: 'frosty', minLvl: 28, maxLvl: 32, chance: 0.3 },
      { id: 'shadowcat', minLvl: 30, maxLvl: 34, chance: 0.3 }
    ]
  },
  'TOWN_DRAGON': {
    id: 'TOWN_DRAGON', name: 'Pico dos Dragões', type: 'CITY', description: 'A última cidade antes do topo do mundo.',
    connections: ['ROUTE_6', 'GYM_DRAGON']
  },
  'GYM_DRAGON': {
    id: 'GYM_DRAGON', name: 'Ginásio Dragão', type: 'GYM', description: 'O líder Lance o desafia com sua fúria.',
    connections: ['TOWN_DRAGON'],
    gymLeader: {
      name: 'Mestre Lance', badge: 'Insígnia Dragão', rewardMessage: 'Você é um verdadeiro mestre! Leve a última insígnia.',
      team: [generateMonster('wyvern', 45), generateMonster('glacius', 42), generateMonster('nightmare', 44)]
    }
  }
};

type GameState = 'START' | 'MAP' | 'BATTLE' | 'MENU' | 'POKEDEX' | 'TRAVEL' | 'SHOP' | 'PC';
type BattleMode = 'WILD' | 'TRAINER';

interface Inventory {
  pokeballs: number;
  potions: number;
  super_potions: number;
  revives: number;
  money: number;
}

const HealthBar = ({ hp, maxHp, status }: { hp: number, maxHp: number, status?: StatusType }) => {
  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = percent > 50 ? 'bg-emerald-500' : percent > 20 ? 'bg-amber-500' : 'bg-rose-500';
  
  const statusColors: Record<string, string> = {
    BURN: 'bg-rose-500 text-white',
    POISON: 'bg-fuchsia-500 text-white',
    PARALYSIS: 'bg-amber-400 text-stone-900',
    SLEEP: 'bg-slate-400 text-white',
    FREEZE: 'bg-cyan-300 text-stone-900',
    CONFUSION: 'bg-pink-400 text-white'
  };

  return (
    <div>
      <div className="w-full bg-stone-200 rounded-full h-2.5 mt-2 overflow-hidden border border-stone-300">
        <div 
          style={{ width: `${percent}%` }}
          className={`h-full ${color} transition-all duration-300 ease-out`}
        />
      </div>
      {status && (
        <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${statusColors[status]}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export function PokemonBattle() {
  const [gameState, setGameState] = useState<GameState>('START');
  
  const [team, setTeam] = useState<MonsterInstance[]>([]);
  const [pcBox, setPcBox] = useState<MonsterInstance[]>([]);
  const [inventory, setInventory] = useState<Inventory>({ pokeballs: 10, potions: 5, super_potions: 0, revives: 2, money: 500 });
  const [badges, setBadges] = useState<string[]>([]);
  const [currentLoc, setCurrentLoc] = useState<string>('TOWN_START');
  const [visitedLocs, setVisitedLocs] = useState<Set<string>>(new Set(['TOWN_START']));
  const [pokedexSeen, setPokedexSeen] = useState<Set<string>>(new Set());
  const [pokedexCaught, setPokedexCaught] = useState<Set<string>>(new Set());

  // Battle State
  const [battleMode, setBattleMode] = useState<BattleMode>('WILD');
  const [enemyTeam, setEnemyTeam] = useState<MonsterInstance[]>([]);
  const [activeEnemyIdx, setActiveEnemyIdx] = useState(0);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [trainerName, setTrainerName] = useState('');
  
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerAnim, setPlayerAnim] = useState('');
  const [enemyAnim, setEnemyAnim] = useState('');
  const [playerHitText, setPlayerHitText] = useState<number | null>(null);
  const [enemyHitText, setEnemyHitText] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleLog]);

  const addLog = (msg: string) => {
    setBattleLog(prev => [...prev, msg]);
  };

  const startGame = (starterId: string) => {
    const starter = generateMonster(starterId, 5);
    setTeam([starter]);
    setPokedexSeen(new Set([starterId]));
    setPokedexCaught(new Set([starterId]));
    setGameState('MAP');
    setCurrentLoc('TOWN_START');
    setVisitedLocs(new Set(['TOWN_START']));
  };

  const healTeam = () => {
    setTeam(prev => prev.map(m => ({ ...m, hp: m.maxHp, status: null as StatusType | null, sleepTurns: 0 })));
    alert("Sua equipe foi totalmente curada!");
  };

  const startWildBattle = (routeId: string) => {
    const route = WORLD[routeId];
    if (!route.encounters) return;
    
    const rand = Math.random();
    let cumulative = 0;
    let chosenEncounter = route.encounters[0];
    for (const enc of route.encounters) {
      cumulative += enc.chance;
      if (rand <= cumulative) {
        chosenEncounter = enc;
        break;
      }
    }
    
    const level = Math.floor(Math.random() * (chosenEncounter.maxLvl - chosenEncounter.minLvl + 1)) + chosenEncounter.minLvl;
    const wildMon = generateMonster(chosenEncounter.id, level);
    
    // Find first alive in player team
    const firstAlive = team.findIndex(m => m.hp > 0);
    if (firstAlive === -1) {
      alert("Sua equipe está desmaiada! Vá ao Centro de Cura.");
      return;
    }

    setActivePlayerIdx(firstAlive);
    setEnemyTeam([wildMon]);
    setPokedexSeen(prev => new Set([...prev, wildMon.dataId]));
    setActiveEnemyIdx(0);
    setBattleMode('WILD');
    setGameState('BATTLE');
    setBattleLog([`Um ${wildMon.name} selvagem apareceu!`, `Vai, ${team[firstAlive].name}!`] );
    setIsPlayerTurn(true);
  };

  const startTrainerBattle = (gymLeader: GymLeader) => {
    const firstAlive = team.findIndex(m => m.hp > 0);
    if (firstAlive === -1) {
      alert("Sua equipe está desmaiada! Vá ao Centro de Cura.");
      return;
    }

    setActivePlayerIdx(firstAlive);
    setEnemyTeam(gymLeader.team.map(m => ({...m, hp: m.maxHp})));
    setPokedexSeen(prev => {
      const s = new Set(prev);
      gymLeader.team.forEach(m => s.add(m.dataId));
      return s;
    });
    setActiveEnemyIdx(0);
    setTrainerName(gymLeader.name);
    setBattleMode('TRAINER');
    setGameState('BATTLE');
    setBattleLog([`${gymLeader.name} quer batalhar!`, `Vai, ${team[firstAlive].name}!`] );
    setIsPlayerTurn(true);
  };

  const calculateDamage = (attacker: MonsterInstance, defender: MonsterInstance, move: Move) => {
    if (move.isStatusOnly) return { damage: 0, effectMsg: '' };
    
    const isCrit = Math.random() < 0.1;
    let actualAtk = attacker.attack;
    if (attacker.status === 'BURN') actualAtk = actualAtk / 2;
    
    let baseDamage = (((2 * attacker.level / 5 + 2) * move.power * (actualAtk / defender.defense)) / 50 + 2);
    
    const modifierType = TYPE_MULTIPLIERS[move.type][defender.type];
    const stab = move.type === attacker.type ? 1.5 : 1;
    const random = (Math.floor(Math.random() * 16) + 85) / 100;
    const critMult = isCrit ? 1.5 : 1;
    
    let effectMsg = '';
    if (modifierType > 1) effectMsg = 'Foi super efetivo!';
    if (modifierType < 1) effectMsg = 'Não foi muito efetivo...';
    if (isCrit) effectMsg = 'Acerto Crítico! ' + effectMsg;

    const damage = Math.floor(baseDamage * modifierType * stab * random * critMult);
    return { damage, effectMsg };
  };

  const executeTurn = async (attacker: MonsterInstance, defender: MonsterInstance, move: Move, isPlayerAttacking: boolean) => {
    setIsAnimating(true);
    
    // Status Checks
    if (attacker.status === 'PARALYSIS' && Math.random() < 0.25) {
      addLog(`${attacker.name} está paralisado e não consegue se mover!`);
      await new Promise(r => setTimeout(r, 1000));
      setIsAnimating(false);
      return;
    }
    if (attacker.status === 'SLEEP') {
      if (attacker.sleepTurns && attacker.sleepTurns > 0) {
        addLog(`${attacker.name} está dormindo zzz...`);
        if (isPlayerAttacking) {
          setTeam(prev => { const n = [...prev]; n[activePlayerIdx].sleepTurns! -= 1; if(n[activePlayerIdx].sleepTurns === 0) n[activePlayerIdx].status = null; return n; });
        } else {
          setEnemyTeam(prev => { const n = [...prev]; n[activeEnemyIdx].sleepTurns! -= 1; if(n[activeEnemyIdx].sleepTurns === 0) n[activeEnemyIdx].status = null; return n; });
        }
        await new Promise(r => setTimeout(r, 1000));
        setIsAnimating(false);
        return;
      }
    }
    if (attacker.status === 'FREEZE') {
      if (Math.random() < 0.2) {
        addLog(`${attacker.name} descongelou!`);
        if (isPlayerAttacking) { setTeam(prev => { const n = [...prev]; n[activePlayerIdx].status = null; return n; }); }
        else { setEnemyTeam(prev => { const n = [...prev]; n[activeEnemyIdx].status = null; return n; }); }
      } else {
        addLog(`${attacker.name} está congelado sólido!`);
        await new Promise(r => setTimeout(r, 1000));
        setIsAnimating(false);
        return;
      }
    }

    if (isPlayerAttacking) setPlayerAnim('animate-ping-once');
    else setEnemyAnim('animate-ping-once');
    
    audioSystem.playPop();
    addLog(`${attacker.name} usou ${move.name}!`);
    await new Promise(r => setTimeout(r, 800));
    
    if (Math.random() * 100 > move.accuracy) {
      addLog(`O ataque falhou!`);
    } else {
      const { damage, effectMsg } = calculateDamage(attacker, defender, move);
      
      if (isPlayerAttacking) {
        setEnemyTeam(prev => {
          const newTeam = [...prev];
          newTeam[activeEnemyIdx].hp = Math.max(0, newTeam[activeEnemyIdx].hp - damage);
          return newTeam;
        });
        if (damage > 0) {
          setEnemyAnim('animate-shake');
          setEnemyHitText(damage);
          setTimeout(() => setEnemyHitText(null), 800);
        }
      } else {
        setTeam(prev => {
          const newTeam = [...prev];
          newTeam[activePlayerIdx].hp = Math.max(0, newTeam[activePlayerIdx].hp - damage);
          return newTeam;
        });
        if (damage > 0) {
          setPlayerAnim('animate-shake');
          setPlayerHitText(damage);
          setTimeout(() => setPlayerHitText(null), 800);
        }
      }
      
      if (damage > 0) audioSystem.playHit();
      if (effectMsg) addLog(effectMsg);
      await new Promise(r => setTimeout(r, 800));

      // Apply status effect from move
      if (move.statusEffect && Math.random() < (move.statusChance || 1) && !defender.status) {
         if (isPlayerAttacking) {
           setEnemyTeam(prev => {
             const newTeam = [...prev];
             newTeam[activeEnemyIdx].status = move.statusEffect!;
             if (move.statusEffect === 'SLEEP') newTeam[activeEnemyIdx].sleepTurns = Math.floor(Math.random() * 3) + 2;
             return newTeam;
           });
         } else {
           setTeam(prev => {
             const newTeam = [...prev];
             newTeam[activePlayerIdx].status = move.statusEffect!;
             if (move.statusEffect === 'SLEEP') newTeam[activePlayerIdx].sleepTurns = Math.floor(Math.random() * 3) + 2;
             return newTeam;
           });
         }
         addLog(`${defender.name} foi afetado por ${move.statusEffect}!`);
         await new Promise(r => setTimeout(r, 800));
      }
    }
    
    // Post-turn Status (Burn, Poison)
    if (attacker.status === 'BURN' || attacker.status === 'POISON') {
       const dmg = Math.floor(attacker.maxHp * (attacker.status === 'POISON' ? 0.125 : 0.0625)) || 1;
       addLog(`${attacker.name} sofreu dano de ${attacker.status}!`);
       if (isPlayerAttacking) {
         setTeam(prev => {
           const newTeam = [...prev];
           newTeam[activePlayerIdx].hp = Math.max(0, newTeam[activePlayerIdx].hp - dmg);
           return newTeam;
         });
         setPlayerHitText(dmg);
         setTimeout(() => setPlayerHitText(null), 800);
       } else {
         setEnemyTeam(prev => {
           const newTeam = [...prev];
           newTeam[activeEnemyIdx].hp = Math.max(0, newTeam[activeEnemyIdx].hp - dmg);
           return newTeam;
         });
         setEnemyHitText(dmg);
         setTimeout(() => setEnemyHitText(null), 800);
       }
       await new Promise(r => setTimeout(r, 800));
    }

    setPlayerAnim('');
    setEnemyAnim('');
    setIsAnimating(false);
  };

  const processEndOfBattle = (won: boolean) => {
    if (won) {
      audioSystem.playWin();
      if (battleMode === 'TRAINER') {
        const gym = WORLD[currentLoc].gymLeader!;
        addLog(`Você derrotou ${gym.name}!`);
        addLog(gym.rewardMessage);
        
        const moneyEarned = gym.team.reduce((acc, m) => acc + m.level * 100, 0);
        addLog(`Você ganhou $${moneyEarned}!`);
        
        setTimeout(() => {
          if (!badges.includes(gym.badge)) {
            setBadges(prev => [...prev, gym.badge]);
          }
          setInventory(prev => ({ ...prev, pokeballs: prev.pokeballs + 5, potions: prev.potions + 3, money: prev.money + moneyEarned }));
          setGameState('MAP');
        }, 3500);
      } else {
        addLog("Você venceu a batalha!");
        
        const xpEarned = enemyTeam[0].level * 20;
        const moneyEarned = enemyTeam[0].level * 10;
        addLog(`${team[activePlayerIdx].name} ganhou ${xpEarned} XP!`);
        addLog(`Você encontrou $${moneyEarned}!`);
        setInventory(prev => ({ ...prev, money: prev.money + moneyEarned }));
        
        const newTeam = [...team];
        const activeMon = newTeam[activePlayerIdx];
        activeMon.xp += xpEarned;
        
        while (activeMon.xp >= activeMon.maxXp) {
          activeMon.level++;
          activeMon.xp -= activeMon.maxXp;
          activeMon.maxXp += 100;
          activeMon.maxHp += 5;
          activeMon.hp += 5;
          activeMon.attack += 2;
          activeMon.defense += 2;
          activeMon.speed += 2;
          addLog(`${activeMon.name} subiu para o nível ${activeMon.level}!`);
          
          const dbData = MONSTERS_DB[activeMon.dataId];
          if (dbData.evolveAt && activeMon.level >= dbData.evolveAt && dbData.evolveTo) {
             const evolveTo = MONSTERS_DB[dbData.evolveTo];
             addLog(`O que é isso?! ${activeMon.name} está evoluindo...`);
             addLog(`Parabéns! Seu ${activeMon.name} evoluiu para ${evolveTo.name}!`);
             activeMon.dataId = dbData.evolveTo;
             activeMon.name = evolveTo.name;
             activeMon.emoji = evolveTo.emoji;
             activeMon.type = evolveTo.type;
             activeMon.color = evolveTo.color;
             // upgrade base stats mapping
             activeMon.maxHp += 15;
             activeMon.hp += 15;
             activeMon.attack += 10;
             activeMon.defense += 10;
             activeMon.speed += 10;
             setPokedexSeen(prev => new Set(prev).add(dbData.evolveTo!));
             setPokedexCaught(prev => new Set(prev).add(dbData.evolveTo!));
          }
        }
        setTeam(newTeam);

        setTimeout(() => {
          setGameState('MAP');
        }, 2500);
      }
    } else {
      addLog("Sua equipe desmaiou! Correndo para o Centro de Cura...");
      setTimeout(() => {
        healTeam();
        setGameState('MAP');
      }, 3000);
    }
  };

  const handleMove = async (move: Move) => {
    if (isAnimating || !isPlayerTurn) return;
    
    const pMon = team[activePlayerIdx];
    let eMon = enemyTeam[activeEnemyIdx];
    
    await executeTurn(pMon, eMon, move, true);
    
    // Refresh enemy reference
    setEnemyTeam(currE => {
      eMon = currE[activeEnemyIdx];
      if (eMon.hp <= 0) {
        addLog(`${eMon.name} inimigo desmaiou!`);
        if (battleMode === 'WILD') {
          processEndOfBattle(true);
        } else {
          // Check if trainer has more
          if (activeEnemyIdx + 1 < enemyTeam.length) {
            setTimeout(() => {
              setActiveEnemyIdx(prev => prev + 1);
              const nextEnemy = enemyTeam[activeEnemyIdx + 1];
              addLog(`${trainerName} enviou ${nextEnemy.name}!`);
            }, 1000);
          } else {
            processEndOfBattle(true);
          }
        }
      } else {
        // Enemy's turn
        setTimeout(async () => {
          const enemyMove = eMon.moves[Math.floor(Math.random() * eMon.moves.length)];
          setTeam(currP => {
              const currentPMon = currP[activePlayerIdx];
              executeTurn(eMon, currentPMon, enemyMove, false).then(() => {
                  setTeam(postP => {
                      if (postP[activePlayerIdx].hp <= 0) {
                          addLog(`${postP[activePlayerIdx].name} desmaiou.`);
                          const nextAliveIndex = postP.findIndex(m => m.hp > 0);
                          if (nextAliveIndex === -1) {
                              processEndOfBattle(false);
                          } else {
                              addLog(`Escolha outro monstro! (Abra o menu Equipe)`);
                              setIsPlayerTurn(true); // Let them choose
                          }
                      } else {
                          setIsPlayerTurn(true);
                      }
                      return postP;
                  });
              });
              return currP;
          });
        }, 1000);
      }
      return currE;
    });
    
    setIsPlayerTurn(false);
  };

  const catchWild = () => {
    if (battleMode !== 'WILD') return;
    if (inventory.pokeballs <= 0) {
      addLog("Sem Pokébolas!");
      return;
    }
    
    setInventory(prev => ({ ...prev, pokeballs: prev.pokeballs - 1 }));
    const wildMon = enemyTeam[activeEnemyIdx];
    const catchRate = (1 - (wildMon.hp / wildMon.maxHp)) * 0.5 + 0.2;
    addLog("Você jogou uma Pokébola!");
    
    setIsAnimating(true);
    setEnemyAnim('animate-ping-once');
    
    setTimeout(() => {
      if (Math.random() < catchRate) {
        addLog(`Gotcha! ${wildMon.name} foi capturado!`);
        if (team.length < 6) {
          setTeam(prev => [...prev, wildMon]);
        } else {
          setPcBox(prev => [...prev, wildMon]);
          addLog("Sua equipe está cheia! Enviado para o PC.");
        }
        setPokedexCaught(prev => new Set(prev).add(wildMon.dataId));
        setTimeout(() => setGameState('MAP'), 2500);
      } else {
        addLog("Oh não! O monstro escapou da Pokébola!");
        // Enemy retaliates
        setTimeout(async () => {
          const enemyMove = wildMon.moves[Math.floor(Math.random() * wildMon.moves.length)];
          const pMon = team[activePlayerIdx];
          await executeTurn(wildMon, pMon, enemyMove, false);
          
          setTeam(postP => {
            if (postP[activePlayerIdx].hp <= 0) {
                addLog(`${postP[activePlayerIdx].name} desmaiou.`);
                const nextAliveIndex = postP.findIndex(m => m.hp > 0);
                if (nextAliveIndex === -1) {
                    processEndOfBattle(false);
                } else {
                    addLog(`Escolha outro monstro! (Abra o menu Equipe)`);
                }
            }
            return postP;
          });
          setIsPlayerTurn(true);
          setIsAnimating(false);
        }, 1000);
      }
    }, 1500);
    setIsPlayerTurn(false);
  };

  const useRevive = () => {
    if (inventory.revives <= 0) {
      addLog("Sem Reviver!");
      return;
    }
    const pMon = team[activePlayerIdx];
    if (pMon.hp > 0) {
      addLog("Só pode usar em monstros desmaiados! (Troque via botão de equipe para reviver, ou apenas use no Menu)");
      // Let's improve the usability: since active player idx is currently the one fighting, they can't be dead (unless they just died and the game hasn't forced a switch yet?? wait, if a monster dies, we force switch).
      // If we are in battle, normally we revive a fainted from team.
      // Easiest is to heal the first fainted team member inline, or tell them they need to use the team menu.
      const firstFainted = team.findIndex(m => m.hp <= 0);
      if (firstFainted === -1) {
        addLog("Nenhum monstro desmaiado na equipe!");
        return;
      }
      setInventory(prev => ({ ...prev, revives: prev.revives - 1 }));
      setTeam(prev => {
        const newTeam = [...prev];
        newTeam[firstFainted].hp = Math.floor(newTeam[firstFainted].maxHp / 2);
        return newTeam;
      });
      addLog(`Você reviveu ${team[firstFainted].name}!`);
    } else {
      setInventory(prev => ({ ...prev, revives: prev.revives - 1 }));
      setTeam(prev => {
        const newTeam = [...prev];
        newTeam[activePlayerIdx].hp = Math.floor(newTeam[activePlayerIdx].maxHp / 2);
        return newTeam;
      });
      addLog(`Você reviveu ${pMon.name}!`);
    }
    setIsPlayerTurn(false);
    
    // Enemy retaliates
    const eMon = enemyTeam[activeEnemyIdx];
    setTimeout(async () => {
      const enemyMove = eMon.moves[Math.floor(Math.random() * eMon.moves.length)];
      await executeTurn(eMon, team[activePlayerIdx], enemyMove, false);
      setIsPlayerTurn(true);
      setIsAnimating(false);
    }, 1500);
  };

  const usePotion = () => {
    if (inventory.potions <= 0 && inventory.super_potions <= 0) {
      addLog("Sem Poções!");
      return;
    }
    const pMon = team[activePlayerIdx];
    if (pMon.hp === pMon.maxHp) {
      addLog("HP já está cheio.");
      return;
    }
    
    // Choose which potion to use
    const isSuper = inventory.super_potions > 0 && pMon.hp < pMon.maxHp - 40;
    const isNormal = inventory.potions > 0;
    const usingSuper = isSuper || !isNormal;
    const healAmount = usingSuper ? 100 : 30;
    
    setInventory(prev => ({ 
      ...prev, 
      potions: usingSuper ? prev.potions : prev.potions - 1,
      super_potions: usingSuper ? prev.super_potions - 1 : prev.super_potions
    }));
    
    setTeam(prev => {
      const newTeam = [...prev];
      newTeam[activePlayerIdx].hp = Math.min(newTeam[activePlayerIdx].maxHp, newTeam[activePlayerIdx].hp + healAmount);
      return newTeam;
    });
    addLog(`Você usou ${usingSuper ? 'uma Super Poção' : 'uma Poção'} em ${pMon.name}! Curou ${healAmount} HP.`);
    setIsPlayerTurn(false);
    
    // Enemy retaliates
    const eMon = enemyTeam[activeEnemyIdx];
    setTimeout(async () => {
      const enemyMove = eMon.moves[Math.floor(Math.random() * eMon.moves.length)];
      await executeTurn(eMon, team[activePlayerIdx], enemyMove, false);
      setIsPlayerTurn(true);
      setIsAnimating(false);
    }, 1500);
  };

  const runAway = () => {
    if (battleMode !== 'WILD') {
      addLog("Não pode fugir de uma batalha de treinador!");
      return;
    }
    const escapeChance = 0.5;
    addLog("Tentando fugir...");
    setTimeout(() => {
      if (Math.random() < escapeChance) {
        addLog("Conseguiu fugir com sucesso!");
        setTimeout(() => setGameState('MAP'), 1500);
      } else {
        addLog("Não conseguiu fugir!");
        // Enemy attacks
        const eMon = enemyTeam[activeEnemyIdx];
        const enemyMove = eMon.moves[Math.floor(Math.random() * eMon.moves.length)];
        executeTurn(eMon, team[activePlayerIdx], enemyMove, false).then(() => {
           setIsPlayerTurn(true);
        });
      }
    }, 1000);
    setIsPlayerTurn(false);
  };



  return (
    <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* START SCREEN */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-100 to-rose-50"
          >
            <div className="max-w-2xl w-full text-center">
              <h1 className="text-4xl md:text-5xl font-black text-stone-800 mb-2 font-display uppercase tracking-tight">
                Mundo <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Elemental</span>
              </h1>
              <p className="text-stone-500 mb-8 font-medium">Escolha seu companheiro inicial para explorar a região.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {['ignis', 'aqua', 'terra'].map(id => {
                  const monster = MONSTERS_DB[id];
                  return (
                    <button
                      key={id}
                      onClick={() => startGame(id)}
                      className="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl border border-stone-200 hover:border-transparent hover:-translate-y-2 transition-all duration-300 flex flex-col items-center relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${monster.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform duration-300 drop-shadow-sm">
                        {monster.emoji}
                      </div>
                      <div className="flex items-center gap-2 mb-1 z-10">
                        <span className={`w-3 h-3 rounded-full ${ELEMENT_COLORS[monster.type]}`} />
                        <h3 className="font-bold text-stone-800 text-xl">{monster.name}</h3>
                      </div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider z-10 px-2 py-1 bg-stone-50 rounded-md">
                        Tipo {monster.type}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP / EXPLORATION */}
      <AnimatePresence>
        {gameState === 'MAP' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50"
          >
            {/* Header */}
            <header className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-stone-200 mb-6 gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="bg-stone-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Backpack size={18} className="text-amber-600" />
                  <span className="font-bold text-stone-700">{inventory.pokeballs}</span> Pokébolas, <span className="font-bold text-stone-700">{inventory.potions}</span> Poções
                </div>
                <div className="bg-green-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-green-600 font-black">$</span>
                  <span className="font-bold text-green-800">{inventory.money}</span>
                </div>
                <div className="bg-stone-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Award size={18} className="text-purple-600" />
                  <span className="font-bold text-stone-700">{badges.length}</span> Insígnias
                </div>
              </div>
              <button 
                onClick={() => setGameState('MENU')}
                className="bg-stone-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-stone-700 transition"
              >
                Equipe & Status
              </button>
            </header>

            <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col items-center justify-center">
              <div className="bg-white border-2 border-stone-200 p-8 rounded-3xl shadow-sm w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-sky-400" />
                
                <h2 className="text-3xl font-black text-stone-800 mb-2 flex justify-center items-center gap-3">
                  <MapPin className="text-rose-500" /> {WORLD[currentLoc].name}
                </h2>
                <p className="text-stone-500 mb-8">{WORLD[currentLoc].description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WORLD[currentLoc].type === 'CITY' && (
                    <>
                      <button onClick={healTeam} className="bg-emerald-100 text-emerald-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 transition">
                        <Heart size={20} /> Centro de Cura
                      </button>
                      <button onClick={() => setGameState('SHOP')} className="bg-blue-100 text-blue-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-200 transition">
                        <ShoppingBag size={20} /> Poké Mart
                      </button>
                      <button onClick={() => setGameState('PC')} className="bg-stone-200 text-stone-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-300 transition md:col-span-2">
                        💻 Acessar PC
                      </button>
                    </>
                  )}
                  
                  {WORLD[currentLoc].type === 'ROUTE' && (
                    <button onClick={() => startWildBattle(currentLoc)} className="bg-amber-100 text-amber-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-200 transition">
                      <Sparkles size={20} /> Procurar na Grama Alta
                    </button>
                  )}

                  {WORLD[currentLoc].type === 'GYM' && (
                    <button onClick={() => startTrainerBattle(WORLD[currentLoc].gymLeader!)} className="bg-rose-100 text-rose-800 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-200 transition">
                      <Target size={20} /> Desafiar Líder!
                    </button>
                  )}

                  {WORLD[currentLoc].connections.map(targetLoc => (
                    <button 
                      key={targetLoc} 
                      onClick={() => {
                        setCurrentLoc(targetLoc);
                        setVisitedLocs(prev => new Set(prev).add(targetLoc));
                      }}
                      className="bg-stone-100 text-stone-700 border border-stone-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition"
                    >
                      <Navigation size={20} /> Viajar p/ {WORLD[targetLoc].name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-6 right-6 flex flex-col gap-3">
              <button onClick={() => setGameState('POKEDEX')} className="bg-red-500 hover:bg-red-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 group">
                <div className="w-8 h-8 relative rounded-full border-[3px] border-white flex flex-col items-center justify-center overflow-hidden bg-white">
                   <div className="absolute top-0 left-0 w-full h-[45%] bg-red-500"></div>
                   <div className="absolute bottom-0 left-0 w-full h-[45%] bg-white"></div>
                   <div className="w-2.5 h-2.5 rounded-full border-[2px] border-red-500 bg-white z-10"></div>
                </div>
              </button>
              <button onClick={() => setGameState('TRAVEL')} className="bg-sky-500 hover:bg-sky-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105">
                <Navigation size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU / TEAM */}
      <AnimatePresence>
        {gameState === 'MENU' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50 absolute inset-0 z-[60]"
          >
            <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full">
              <div className="bg-stone-800 p-4 flex items-center gap-4 text-white">
                <button onClick={() => setGameState('MAP')} className="hover:bg-stone-700 p-2 rounded-xl transition">
                  <ArrowLeft />
                </button>
                <h2 className="text-xl font-bold">Sua Equipe</h2>
              </div>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.map((mon, idx) => (
                    <div key={mon.uid} className={`bg-stone-50 border ${mon.hp === 0 ? 'border-rose-300 grayscale' : 'border-stone-200'} p-4 rounded-2xl flex gap-4 items-center`}>
                       <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${mon.color} flex flex-col items-center justify-center text-4xl shadow-inner relative`}>
                          {mon.isShiny && <Sparkles className="absolute top-1 right-1 text-yellow-300" size={12} />}
                          {mon.emoji}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-stone-800">{mon.name} {mon.isShiny && '✨'} {mon.gender === 'MALE' ? '♂️' : mon.gender === 'FEMALE' ? '♀️' : '⚪'}</h3>
                            <span className="text-xs font-bold text-stone-500">Lv.{mon.level}</span>
                          </div>
                          <HealthBar hp={mon.hp} maxHp={mon.maxHp} status={mon.status} />
                          <div className="text-[10px] text-stone-500 text-right mt-1 font-mono">{mon.hp}/{mon.maxHp} HP</div>
                          
                          <div className="mt-2 w-full bg-blue-100 rounded-full h-1">
                            <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min(100, (mon.xp/mon.maxXp)*100)}%`}} />
                          </div>
                          <div className="text-[10px] text-blue-500 text-right font-mono mt-0.5">XP</div>
                          
                          <div className="text-[10px] text-stone-400 mt-2 flex justify-between uppercase font-mono tracking-tighter">
                            <span>IVs</span>
                            <span>HP:{mon.ivs.hp}</span>
                            <span>ATK:{mon.ivs.attack}</span>
                            <span>DEF:{mon.ivs.defense}</span>
                            <span>SPD:{mon.ivs.speed}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
                
                {/* Badge Case */}
                <div className="bg-stone-100 p-6 rounded-3xl border border-stone-200">
                  <h3 className="text-stone-800 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="text-amber-500" /> Estojo de Insígnias
                  </h3>
                  {badges.length === 0 ? (
                    <div className="text-stone-400 text-sm text-center py-6">Nenhuma insígnia conquistada ainda.</div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {badges.map(badge => (
                        <div key={badge} className="bg-white px-4 py-3 rounded-xl border-2 border-amber-300 shadow-sm flex items-center gap-2">
                          <span className="text-xl">🏆</span>
                          <span className="font-bold tracking-tight text-amber-700">{badge}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHOP SCREEN */}
      <AnimatePresence>
        {gameState === 'SHOP' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50 absolute inset-0 z-[60]"
          >
            <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full relative">
              <div className="bg-blue-500 p-4 flex items-center gap-4 text-white shadow-md">
                <button onClick={() => setGameState('MAP')} className="hover:bg-blue-600 p-2 rounded-xl transition">
                  <ArrowLeft />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-black tracking-widest uppercase">Poké Mart</h2>
                </div>
                <div className="w-10"></div>
              </div>
              
              <div className="p-4 bg-blue-50 flex gap-4 text-stone-600 font-bold justify-between border-b border-blue-200 items-center">
                 <div className="text-blue-800 uppercase tracking-widest text-sm">Seu Saldo:</div>
                 <div className="text-xl text-green-600">${inventory.money}</div>
              </div>

              <div className="p-6 overflow-y-auto flex flex-col gap-3">
                 <div className="p-4 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-rose-100 p-3 rounded-full text-rose-500"><Target size={24} /></div>
                     <div>
                       <h3 className="font-bold text-stone-800">Pokébola</h3>
                       <p className="text-xs text-stone-500">Recarga seu estoque de Pokébolas.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (inventory.money >= 200) {
                         setInventory(prev => ({...prev, money: prev.money - 200, pokeballs: prev.pokeballs + 1}));
                       } else {
                         alert('Dinheiro insuficiente.');
                       }
                     }}
                     className={`px-4 py-2 rounded-xl font-bold shadow-sm transition ${inventory.money >= 200 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-stone-100 text-stone-400'}`}
                   >
                     $200
                   </button>
                 </div>
                 
                 <div className="p-4 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-emerald-100 p-3 rounded-full text-emerald-500"><Heart size={24} /></div>
                     <div>
                       <h3 className="font-bold text-stone-800">Poção</h3>
                       <p className="text-xs text-stone-500">Cura 30 HP em batalha.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (inventory.money >= 300) {
                         setInventory(prev => ({...prev, money: prev.money - 300, potions: prev.potions + 1}));
                       } else {
                         alert('Dinheiro insuficiente.');
                       }
                     }}
                     className={`px-4 py-2 rounded-xl font-bold shadow-sm transition ${inventory.money >= 300 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-stone-100 text-stone-400'}`}
                   >
                     $300
                   </button>
                 </div>
                 
                 <div className="p-4 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-emerald-200 p-3 rounded-full text-emerald-600"><Heart size={24} /></div>
                     <div>
                       <h3 className="font-bold text-stone-800">Super Poção</h3>
                       <p className="text-xs text-stone-500">Cura 100 HP em batalha.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (inventory.money >= 700) {
                         setInventory(prev => ({...prev, money: prev.money - 700, super_potions: prev.super_potions + 1}));
                       } else {
                         alert('Dinheiro insuficiente.');
                       }
                     }}
                     className={`px-4 py-2 rounded-xl font-bold shadow-sm transition ${inventory.money >= 700 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-stone-100 text-stone-400'}`}
                   >
                     $700
                   </button>
                 </div>
                 
                 <div className="p-4 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-amber-200 p-3 rounded-full text-amber-600"><Activity size={24} /></div>
                     <div>
                       <h3 className="font-bold text-stone-800">Reviver</h3>
                       <p className="text-xs text-stone-500">Revive um monstro desmaiado.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (inventory.money >= 500) {
                         setInventory(prev => ({...prev, money: prev.money - 500, revives: prev.revives + 1}));
                       } else {
                         alert('Dinheiro insuficiente.');
                       }
                     }}
                     className={`px-4 py-2 rounded-xl font-bold shadow-sm transition ${inventory.money >= 500 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-stone-100 text-stone-400'}`}
                   >
                     $500
                   </button>
                 </div>
                 
                 <div className="p-4 border border-stone-200 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-amber-100 p-3 rounded-full text-amber-500"><Backpack size={24} /></div>
                     <div>
                       <h3 className="font-bold text-stone-800">5x Pacote</h3>
                       <p className="text-xs text-stone-500">5 Pokébolas e 5 Poções.</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (inventory.money >= 2000) {
                         setInventory(prev => ({...prev, money: prev.money - 2000, potions: prev.potions + 5, pokeballs: prev.pokeballs + 5}));
                       } else {
                         alert('Dinheiro insuficiente.');
                       }
                     }}
                     className={`px-4 py-2 rounded-xl font-bold shadow-sm transition ${inventory.money >= 2000 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-stone-100 text-stone-400'}`}
                   >
                     $2000
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PC SCREEN */}
      <AnimatePresence>
        {gameState === 'PC' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50 absolute inset-0 z-50"
          >
            <div className="max-w-4xl w-full mx-auto bg-stone-800 rounded-3xl shadow-xl overflow-hidden border border-stone-700 flex flex-col h-full relative">
              <div className="bg-stone-900 p-4 flex items-center gap-4 text-white shadow-md">
                <button onClick={() => setGameState('MAP')} className="hover:bg-stone-700 p-2 rounded-xl transition">
                  <ArrowLeft />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-black tracking-widest uppercase flex items-center justify-center gap-2">💻 Sistema de PC</h2>
                </div>
                <div className="w-10"></div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-800">
                
                {/* Team Box */}
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col">
                  <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Sua Equipe ({team.length}/6)</h3>
                  <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                    {team.map((mon, idx) => (
                      <div key={mon.uid} className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex gap-3 items-center">
                         <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mon.color} flex items-center justify-center text-xl shadow-inner`}>
                            {mon.emoji}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-stone-800 text-sm">{mon.name} {mon.isShiny && '✨'}</h4>
                              <span className="text-[10px] font-bold text-stone-500">Lv.{mon.level}</span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono mt-1">{mon.hp}/{mon.maxHp} HP</div>
                         </div>
                         <button 
                           onClick={() => {
                             if (team.length <= 1) {
                               alert('Você precisa de no mínimo 1 monstro na equipe!');
                               return;
                             }
                             const newTeam = [...team];
                             newTeam.splice(idx, 1);
                             setTeam(newTeam);
                             setPcBox(prev => [...prev, mon]);
                           }}
                           className="bg-rose-100 text-rose-700 p-2 rounded-lg hover:bg-rose-200 transition"
                           title="Enviar para o PC"
                         >
                           <ArrowLeft className="rotate-180 md:rotate-90" size={16} />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PC Box */}
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col">
                  <h3 className="text-sky-300 font-bold mb-4 uppercase tracking-wider">PC Box ({pcBox.length})</h3>
                  <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                    {pcBox.length === 0 ? (
                      <div className="text-stone-400 text-center text-sm p-4 border border-dashed border-stone-600 rounded-xl">O PC está vazio.</div>
                    ) : pcBox.map((mon, idx) => (
                      <div key={mon.uid} className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex gap-3 items-center">
                         <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mon.color} flex items-center justify-center text-xl shadow-inner`}>
                            {mon.emoji}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-stone-800 text-sm">{mon.name} {mon.isShiny && '✨'}</h4>
                              <span className="text-[10px] font-bold text-stone-500">Lv.{mon.level}</span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono mt-1">{mon.hp}/{mon.maxHp} HP</div>
                         </div>
                         <button 
                           onClick={() => {
                             if (team.length >= 6) {
                               alert('Sua equipe está cheia!');
                               return;
                             }
                             const newBox = [...pcBox];
                             newBox.splice(idx, 1);
                             setPcBox(newBox);
                             setTeam(prev => [...prev, mon]);
                           }}
                           className="bg-sky-100 text-sky-700 p-2 rounded-lg hover:bg-sky-200 transition"
                           title="Colocar na Equipe"
                         >
                           <ArrowLeft className="md:-rotate-90" size={16} />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POKEDEX SCREEN */}
      <AnimatePresence>
        {gameState === 'POKEDEX' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50 absolute inset-0 z-50"
          >
            <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full relative">
              <div className="bg-red-500 p-4 flex items-center gap-4 text-white shadow-md">
                <button onClick={() => setGameState('MAP')} className="hover:bg-red-600 p-2 rounded-xl transition">
                  <ArrowLeft />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-black tracking-widest uppercase">Pokédex</h2>
                </div>
                <div className="w-10"></div>
              </div>
              
              <div className="p-4 bg-stone-100 flex gap-4 text-stone-600 font-bold justify-center border-b border-stone-200">
                 <div>Vistos: {pokedexSeen.size}</div>
                 <div>Capturados: {pokedexCaught.size}</div>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Object.values(MONSTERS_DB).map((mon) => {
                   const isSeen = pokedexSeen.has(mon.id);
                   const isCaught = pokedexCaught.has(mon.id);
                   return (
                     <div key={mon.id} className={`border p-3 rounded-2xl flex flex-col items-center justify-center gap-2 ${
                       isCaught ? 'bg-white border-stone-200 shadow-sm' : 
                       isSeen ? 'bg-stone-50 border-stone-200 opacity-60 grayscale' : 'bg-stone-100 border-dashed border-stone-300 opacity-30 blur-[2px]'
                     }`}>
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-inner ${isCaught ? 'bg-gradient-to-br ' + mon.color : 'bg-stone-200'}`}>
                         {isSeen ? mon.emoji : '?'}
                       </div>
                       <span className="font-bold text-xs text-stone-700 uppercase">{isSeen ? mon.name : '???'}</span>
                       {isCaught && (
                         <div className="w-3 h-3 rounded-full border border-red-500 bg-white relative overflow-hidden flex items-center justify-center">
                           <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
                         </div>
                       )}
                     </div>
                   )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRAVEL SCREEN */}
      <AnimatePresence>
        {gameState === 'TRAVEL' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="w-full h-full p-4 md:p-8 flex flex-col bg-stone-50 absolute inset-0 z-50"
          >
            <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full">
              <div className="bg-sky-500 p-4 flex items-center gap-4 text-white shadow-md">
                <button onClick={() => setGameState('MAP')} className="hover:bg-sky-600 p-2 rounded-xl transition">
                  <ArrowLeft />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-xl font-bold tracking-widest uppercase">Voar (Fast Travel)</h2>
                </div>
                <div className="w-10"></div>
              </div>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-3">
                 <p className="text-stone-500 text-center font-medium mb-4">Escolha uma cidade ou rota já visitada para voar imediatamente.</p>
                 {Array.from(visitedLocs).map((locId: unknown) => {
                    const id = locId as string;
                    const loc = WORLD[id];
                    if (!loc) return null;
                    return (
                      <button 
                        key={id}
                        onClick={() => {
                          setCurrentLoc(id);
                          setGameState('MAP');
                        }}
                        className={`p-4 rounded-2xl flex items-center justify-between text-left transition ${id === currentLoc ? 'bg-sky-50 border-2 border-sky-300 pointer-events-none' : 'bg-stone-50 border border-stone-200 hover:bg-sky-50 hover:border-sky-300'}`}
                      >
                         <div className="flex items-center gap-3">
                           {loc.type === 'CITY' ? <MapPin className="text-rose-500" /> : <Navigation className="text-stone-400" />}
                           <div>
                             <h3 className="font-bold text-stone-800">{loc.name}</h3>
                             <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">{loc.type}</span>
                           </div>
                         </div>
                         {locId === currentLoc && <span className="text-xs font-bold text-sky-500 bg-sky-100 px-2 py-1 rounded-full">Atual</span>}
                      </button>
                    )
                 })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BATTLE SCREEN */}
      <AnimatePresence>
        {gameState === 'BATTLE' && team[activePlayerIdx] && enemyTeam[activeEnemyIdx] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full h-full max-w-4xl mx-auto flex flex-col relative z-20 bg-stone-100"
          >
            {/* Battlefield Layer */}
            <div className="flex-1 flex flex-col p-4 md:p-8 justify-between relative bg-gradient-to-b from-sky-100 to-green-100 rounded-3xl m-4 border border-stone-200 overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPHBhdGggZD0iTTAgMmgxdjM4SDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPC9zdmc+')] opacity-50" />

              {/* Enemy Side */}
              <div className="flex justify-end pr-4 md:pr-12 mt-4 relative z-10 w-full group">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-sm border border-stone-200 min-w-[200px] mb-4 md:mb-0 md:-ml-8 md:mr-8 self-start">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black text-stone-800 uppercase tracking-tight">
                      {enemyTeam[activeEnemyIdx].name} {enemyTeam[activeEnemyIdx].isShiny && '✨'}
                      <span className="ml-1 text-sm">{enemyTeam[activeEnemyIdx].gender === 'MALE' ? '♂' : enemyTeam[activeEnemyIdx].gender === 'FEMALE' ? '♀' : ''}</span>
                    </h3>
                    <span className="text-xs font-bold text-stone-500">Lv.{enemyTeam[activeEnemyIdx].level}</span>
                  </div>
                  <HealthBar hp={enemyTeam[activeEnemyIdx].hp} maxHp={enemyTeam[activeEnemyIdx].maxHp} status={enemyTeam[activeEnemyIdx].status} />
                </div>
                
                <div className="relative">
                  <motion.div 
                    initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className={`w-32 h-32 md:w-48 md:h-48 drop-shadow-xl text-7xl md:text-9xl flex items-center justify-center relative ${enemyAnim}`}
                  >
                    <span className={enemyTeam[activeEnemyIdx].isShiny ? "hue-rotate-[120deg]" : ""}>
                      {enemyTeam[activeEnemyIdx].emoji}
                    </span>
                    <AnimatePresence>
                      {enemyHitText !== null && (
                        <motion.div 
                          initial={{ y: 0, opacity: 1, scale: 0.5 }} 
                          animate={{ y: -60, opacity: 0, scale: 1.5 }} 
                          exit={{ opacity: 0 }}
                          className="absolute text-rose-500 font-black text-4xl drop-shadow-md z-50 pointer-events-none"
                        >
                          -{enemyHitText}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="w-24 h-4 md:w-32 md:h-6 bg-black/10 rounded-[100%] mx-auto mt-2 blur-[2px]" />
                </div>
              </div>

              {/* Player Side */}
              <div className="flex justify-start pl-4 md:pl-12 mb-4 relative z-10 w-full">
                <div className="relative z-20">
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className={`w-32 h-32 md:w-48 md:h-48 drop-shadow-xl text-7xl md:text-9xl flex items-center justify-center relative ${playerAnim}`}
                  >
                    <span className={team[activePlayerIdx].isShiny ? "hue-rotate-[120deg]" : ""}>
                      {team[activePlayerIdx].emoji}
                    </span>
                    <AnimatePresence>
                      {playerHitText !== null && (
                        <motion.div 
                          initial={{ y: 0, opacity: 1, scale: 0.5 }} 
                          animate={{ y: -60, opacity: 0, scale: 1.5 }} 
                          exit={{ opacity: 0 }}
                          className="absolute text-rose-500 font-black text-4xl drop-shadow-md z-50 pointer-events-none"
                        >
                          -{playerHitText}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="w-24 h-4 md:w-32 md:h-6 bg-black/10 rounded-[100%] mx-auto mt-2 blur-[2px]" />
                </div>

                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-sm border border-stone-200 min-w-[200px] mt-8 md:mt-16 md:ml-8 self-end z-10">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black text-stone-800 uppercase tracking-tight">
                      {team[activePlayerIdx].name} {team[activePlayerIdx].isShiny && '✨'}
                      <span className="ml-1 text-sm">{team[activePlayerIdx].gender === 'MALE' ? '♂' : team[activePlayerIdx].gender === 'FEMALE' ? '♀' : ''}</span>
                    </h3>
                    <span className="text-xs font-bold text-stone-500">Lv.{team[activePlayerIdx].level}</span>
                  </div>
                  <HealthBar hp={team[activePlayerIdx].hp} maxHp={team[activePlayerIdx].maxHp} status={team[activePlayerIdx].status} />
                  <div className="text-right text-[10px] font-bold text-stone-500 mt-1">{Math.max(0, team[activePlayerIdx].hp)} / {team[activePlayerIdx].maxHp}</div>
                </div>
              </div>
            </div>

            {/* UI Bottom Area */}
            <div className="flex-1 md:flex-none md:h-[200px] shrink-0 bg-white border-t border-stone-200 flex flex-col md:flex-row shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-b-xl z-20 min-h-0">
              <div className="flex-1 min-h-0 p-3 md:p-6 border-b md:border-b-0 md:border-r border-stone-100 bg-stone-50/50 relative overflow-hidden flex flex-col">
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-2">
                  {battleLog.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-stone-700 font-medium leading-relaxed text-sm">
                      {log}
                    </motion.div>
                  ))}
                  {isAnimating && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }} className="text-stone-400">...</motion.div>}
                </div>
              </div>

              {/* Action Menu */}
              <div className="w-full shrink-0 md:w-[480px] p-2 md:p-4 bg-white flex flex-col justify-center">
                 <div className="grid grid-cols-2 gap-2 h-full">
                    {/* Moves */}
                    {team[activePlayerIdx].moves.map((move) => (
                      <button
                        key={move.id} disabled={!isPlayerTurn || isAnimating} onClick={() => handleMove(move)}
                        className={`p-2 rounded-xl border-2 flex flex-col items-start justify-center group
                          ${!isPlayerTurn || isAnimating ? 'opacity-50 cursor-not-allowed border-stone-200 bg-stone-50' : 'border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 active:scale-95 shadow-sm'}
                        `}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-stone-800 text-sm tracking-tight">{move.name}</span>
                          <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm ${ELEMENT_COLORS[move.type]}`}>{move.type}</span>
                        </div>
                      </button>
                    ))}
                    
                    {/* Utility Actions */}
                    <div className="col-span-2 grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-100">
                      <button 
                        onClick={catchWild} disabled={!isPlayerTurn || isAnimating || battleMode !== 'WILD'}
                        className={`p-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs ${!isPlayerTurn||battleMode!=='WILD'?'opacity-50 bg-stone-100 text-stone-400':'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                      >
                        <Target size={14} /> Capt. ({inventory.pokeballs})
                      </button>
                      <button 
                        onClick={usePotion} disabled={!isPlayerTurn || isAnimating}
                        className={`p-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs ${!isPlayerTurn?'opacity-50 bg-stone-100 text-stone-400':'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                      >
                        <Heart size={14} /> Poção {inventory.super_potions > 0 ? `(${inventory.potions}+${inventory.super_potions})` : `(${inventory.potions})`}
                      </button>
                      <button 
                        onClick={useRevive} disabled={!isPlayerTurn || isAnimating}
                        className={`p-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs ${!isPlayerTurn?'opacity-50 bg-stone-100 text-stone-400':'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                      >
                        <Activity size={14} /> Reviver ({inventory.revives})
                      </button>
                      <button 
                        onClick={runAway} disabled={!isPlayerTurn || isAnimating || battleMode !== 'WILD'}
                        className={`p-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs ${!isPlayerTurn||battleMode!=='WILD'?'opacity-50 bg-stone-100 text-stone-400':'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                      >
                        Fugir
                      </button>
                    </div>
                  </div>
              </div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html:`
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-4px, 0, 0); }
          20%, 80% { transform: translate3d(6px, 0, 0); filter: brightness(2) drop-shadow(0 0 10px red); }
          30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
          40%, 60% { transform: translate3d(8px, 0, 0); }
        }
        .animate-ping-once { animation: ping-once 0.3s ease-out; }
        @keyframes ping-once {
          0% { transform: scale(1); filter: brightness(1) }
          50% { transform: scale(1.3); filter: brightness(1.5) }
          100% { transform: scale(1); filter: brightness(1) }
        }
      `}} />
    </div>
  );
}
