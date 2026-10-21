import { CARD_LIST, CONSUMABLE_LIST, BONUS_INFO, type BonusKind } from '../engine'

/**
 * Windows 95 icons, always shown at their real size (never scaled): cards 48px, items 32px, bonus tiles and small UI 16px.
 * The values are file names (without extension) in public/icons/{16,32,48}; see public/icons/CREDITS.txt.
 * Edit the files, then run scripts/icon-manifest.mjs and scripts/check-icons.ts.
 */
export const CARD_ICON: Record<string, string> = {
  'steady-hand': 'mouse',
  'pocket-change': 'briefcase',
  'lucky-clover': 'notepad_file_gear',
  'lucky-socks': 'time_and_date',
  'counting-beads': 'notepad_file',
  'tidy-sweeper': 'clean_drive',
  'cautious-cat': 'msagent',
  'piggy-bank': 'directory_closed_history',
  magnifier: 'search_file_2',
  'hot-streak': 'joystick',
  'tax-collector': 'odbc',
  gambler: 'mailbox_world',
  'first-blood': 'template_empty',
  sapling: 'windows_update_small',
  lantern: 'system_restore',
  compass: 'directory_fonts',
  scout: 'entire_network_globe',
  'extra-life': 'shut_down_cool',
  crown: 'users_green',
  vault: 'keys',
  'twin-mirror': 'printer',
  'lucky-seven': 'calendar',
  gravedigger: 'recycle_bin_full',
  harvest: 'outlook_express',
  'golden-ratio': 'expand_hierarchial_array',
  phoenix: 'floppy_drive_5_25',
  'fortune-wheel': 'directory_business_calendar',
  metronome: 'keyboard',
  philosopher: 'help_book_computer',
  infinity: 'computer_2_cool',
  midas: 'world',
  heartbeat: 'floppy_drive_3_5',
  omniscience: 'users_key',
  'black-hole': 'hard_disk_drive',
  'dowsing-rod': 'paint_file',
  pickaxe: 'directory_admin_tools',
  bloodhound: 'search_directory',
  spade: 'directory_open_file_mydocs',
  scavenger: 'outlook_express_tack',
  radar: 'scanner_alt',
  excavator: 'removable_disk_drive',
  aftershock: 'network_drive_unavailable',
  cartographer: 'world_network_directories',
  satellite: 'msie1',
}

export const ITEM_ICON: Record<string, string> = {
  sprout: 'hardware',
  scope: 'search_computer',
  sniffer: 'msn3',
  bandage: 'doctor_watson',
  surge: 'ac_plug',
  flashlight: 'tip',
  ward: 'key_padlock',
  dowse: 'notepad',
  shovel: 'mshearts',
  kindle: 'regedit',
}

export const BONUS_ICON: Record<BonusKind, string> = {
  coin: 'certificate_3',
  star: 'world_star',
  spark: 'processor',
  flame: 'mouse',
  crystal: 'internet_connection_wiz',
  gift: 'spider',
  shield: 'world_lock',
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
  streak: 'mouse',
  shield: 'world_lock',
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
