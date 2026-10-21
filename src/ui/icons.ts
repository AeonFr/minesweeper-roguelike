import { CARD_LIST, CONSUMABLE_LIST, BONUS_INFO, type BonusKind } from '../engine'

/** Windows 95 icons (public/icons/*.png) for every card, item and bonus tile. See public/icons/CREDITS.txt. */
export const CARD_ICON: Record<string, string> = {
  'steady-hand': 'mouse',
  'pocket-change': 'cd_audio_cd',
  'lucky-clover': 'trust0',
  'lucky-socks': 'game_solitaire',
  'counting-beads': 'time_and_date',
  'tidy-sweeper': 'clean_drive',
  'cautious-cat': 'msagent_file',
  'piggy-bank': 'hard_disk_drive_pie',
  magnifier: 'magnifying_glass',
  'hot-streak': 'mouse_speed',
  'tax-collector': 'cylinder_database',
  gambler: 'game_freecell',
  'first-blood': 'msg_error',
  sapling: 'tree',
  lantern: 'standby_monitor_moon',
  compass: 'gps',
  scout: 'search_computer',
  'extra-life': 'utopia_smiley',
  crown: 'certificate_seal',
  vault: 'key_padlock',
  'twin-mirror': 'monitor_blue_grad',
  'lucky-seven': 'joystick',
  gravedigger: 'recycle_bin_full',
  harvest: 'package',
  'golden-ratio': 'chart1',
  phoenix: 'directx_alt',
  'fortune-wheel': 'clock',
  metronome: 'drum_onestick',
  philosopher: 'help_book_big',
  infinity: 'world',
  midas: 'world_star',
  heartbeat: 'infrared',
  omniscience: 'file_eye',
  'black-hole': 'processor',
  'dowsing-rod': 'mouse_location',
  pickaxe: 'c_clamp',
  bloodhound: 'search_directory',
  spade: 'directory_open_file_mydocs',
  scavenger: 'recycle_bin_directory',
  radar: 'scanner',
  excavator: 'defragment',
  aftershock: 'scandisk',
  cartographer: 'globe_map',
  satellite: 'search_web',
}

export const ITEM_ICON: Record<string, string> = {
  sprout: 'hardware',
  scope: 'magnifying_glass_3',
  sniffer: 'search_file',
  bandage: 'doctor_watson',
  surge: 'ac_plug',
  flashlight: 'tip',
  ward: 'file_padlock',
  kindle: 'msg_warning_inv',
  dowse: 'mouse_snap',
  shovel: 'nail',
}

export const BONUS_ICON: Record<BonusKind, string> = {
  coin: 'cd_audio_cd',
  star: 'world_star',
  spark: 'directx',
  flame: 'mouse_speed',
  crystal: 'connected_world',
  gift: 'package',
  shield: 'file_padlock',
  life: 'utopia_smiley',
}

export const UI_ICON = {
  mine: 'game_mine_1',
  flag: 'flag.svg',
  life: 'utopia_smiley',
  help: 'help_question_mark',
  music: 'loudspeaker_rays',
  sound: 'loudspeaker_wave',
  logo: 'minesweeper',
  dig: 'tools_gear',
  streak: 'mouse_speed',
  shield: 'file_padlock',
  refresh: 'media_player_stream_conn2',
  money: 'cd_audio_cd',
  check: 'check',
  info: 'msg_information',
} as const

/** Emoji that the (pure) engine puts into event text, mapped to icons so text can show them too. */
export const EMOJI_ICON: Record<string, string> = {}
for (const c of CARD_LIST) EMOJI_ICON[c.emoji] = CARD_ICON[c.id]
for (const c of CONSUMABLE_LIST) EMOJI_ICON[c.emoji] = ITEM_ICON[c.id]
for (const k of Object.keys(BONUS_INFO) as BonusKind[]) EMOJI_ICON[BONUS_INFO[k].emoji] = BONUS_ICON[k]
EMOJI_ICON['🚩'] = 'flag.svg'
EMOJI_ICON['💥'] = UI_ICON.mine
