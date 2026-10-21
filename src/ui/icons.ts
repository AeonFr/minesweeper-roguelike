import { CARD_LIST, CONSUMABLE_LIST, BONUS_INFO, type BonusKind } from '../engine'

/** Windows 95 icons (public/icons/*.png) for every card, item and bonus tile. See public/icons/CREDITS.txt. */
export const CARD_ICON: Record<string, string> = {
  'steady-hand': 'mouse',
  'pocket-change': 'briefcase',
  'lucky-clover': 'check',
  'lucky-socks': 'clock',
  'counting-beads': 'calculator',
  'tidy-sweeper': 'clean_drive',
  'cautious-cat': 'msagent',
  'piggy-bank': 'hard_disk_drive_pie',
  magnifier: 'magnifying_glass',
  'hot-streak': 'keyboard_repeat_rate',
  'tax-collector': 'cylinder_database',
  gambler: 'game_solitaire',
  'first-blood': 'document',
  sapling: 'windows_update_small',
  lantern: 'system_restore',
  compass: 'write_wordpad',
  scout: 'search_file_2',
  'extra-life': 'utopia_smiley',
  crown: 'certificate_seal',
  vault: 'key_padlock',
  'twin-mirror': 'diskettes_copy',
  'lucky-seven': 'script_file_blue',
  gravedigger: 'recycle_bin_full',
  harvest: 'envelope_closed',
  'golden-ratio': 'chart1',
  phoenix: 'cassette_tape',
  'fortune-wheel': 'calendar',
  metronome: 'keyboard',
  philosopher: 'help_book_big',
  infinity: 'server_gear',
  midas: 'bar_graph',
  heartbeat: 'floppy_drive_3_5',
  omniscience: 'file_eye',
  'black-hole': 'file_set',
  'dowsing-rod': 'write_yellow',
  pickaxe: 'c_clamp',
  bloodhound: 'search_directory',
  spade: 'directory_open_cabinet',
  scavenger: 'recycle_bin_directory',
  radar: 'scanner',
  excavator: 'defragment',
  aftershock: 'msg_error',
  cartographer: 'network_three_pcs',
  satellite: 'conn_cloud_ok',
}

export const ITEM_ICON: Record<string, string> = {
  sprout: 'hardware',
  scope: 'magnifying_glass_3',
  sniffer: 'search_file',
  bandage: 'doctor_watson',
  surge: 'ac_plug',
  flashlight: 'tip',
  ward: 'ups',
  kindle: 'joystick_button',
  dowse: 'message_tack',
  shovel: 'erase_file',
}

export const BONUS_ICON: Record<BonusKind, string> = {
  coin: 'certificate_3',
  star: 'world_star',
  spark: 'directx',
  flame: 'mouse_speed',
  crystal: 'search_web',
  gift: 'package',
  shield: 'computer_padlock',
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
  shield: 'computer_padlock',
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
