import MaximizeIcon from '@lucide/svelte/icons/maximize-2';
import MinimizeIcon from '@lucide/svelte/icons/minimize-2';
import IconArrowsMaximize from '@tabler/icons-svelte/icons/arrows-maximize';
import IconArrowsMinimize from '@tabler/icons-svelte/icons/arrows-minimize';
import ArrowsOut from 'phosphor-svelte/lib/ArrowsOut';
import ArrowsIn from 'phosphor-svelte/lib/ArrowsIn';
import RiFullscreenLine from 'remixicon-svelte/icons/fullscreen-line';
import RiFullscreenExitLine from 'remixicon-svelte/icons/fullscreen-exit-line';
import BracesIcon from '@lucide/svelte/icons/braces';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import CalendarIcon from '@lucide/svelte/icons/calendar';
import CheckIcon from '@lucide/svelte/icons/check';
import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
import Clock3Icon from '@lucide/svelte/icons/clock-3';
import Dice5Icon from '@lucide/svelte/icons/dice-5';
import EyeIcon from '@lucide/svelte/icons/eye';
import EyeOffIcon from '@lucide/svelte/icons/eye-off';
import GithubIcon from '@lucide/svelte/icons/github';
import LaptopMinimalCheckIcon from '@lucide/svelte/icons/laptop-minimal-check';
import ListIcon from '@lucide/svelte/icons/list';
import MenuIcon from '@lucide/svelte/icons/menu';
import MoonIcon from '@lucide/svelte/icons/moon';
import PaletteIcon from '@lucide/svelte/icons/palette';
import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
import PencilIcon from '@lucide/svelte/icons/pencil';
import PlusIcon from '@lucide/svelte/icons/plus';
import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
import SaveIcon from '@lucide/svelte/icons/save';
import SearchIcon from '@lucide/svelte/icons/search';
import Settings2Icon from '@lucide/svelte/icons/settings-2';
import SunIcon from '@lucide/svelte/icons/sun';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import XIcon from '@lucide/svelte/icons/x';
import IconAlertCircle from '@tabler/icons-svelte/icons/alert-circle';
import IconBraces from '@tabler/icons-svelte/icons/braces';
import IconBrandGithub from '@tabler/icons-svelte/icons/brand-github';
import IconCalendar from '@tabler/icons-svelte/icons/calendar';
import IconCalendarClock from '@tabler/icons-svelte/icons/calendar-clock';
import IconCheck from '@tabler/icons-svelte/icons/check';
import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
import IconChevronUp from '@tabler/icons-svelte/icons/chevron-up';
import IconClock from '@tabler/icons-svelte/icons/clock';
import IconDeviceFloppy from '@tabler/icons-svelte/icons/device-floppy';
import IconDeviceLaptop from '@tabler/icons-svelte/icons/device-laptop';
import IconDice5 from '@tabler/icons-svelte/icons/dice-5';
import IconEye from '@tabler/icons-svelte/icons/eye';
import IconEyeOff from '@tabler/icons-svelte/icons/eye-off';
import IconLayoutSidebar from '@tabler/icons-svelte/icons/layout-sidebar';
import IconList from '@tabler/icons-svelte/icons/list';
import IconMenu2 from '@tabler/icons-svelte/icons/menu-2';
import IconMoon from '@tabler/icons-svelte/icons/moon';
import IconPalette from '@tabler/icons-svelte/icons/palette';
import IconPencil from '@tabler/icons-svelte/icons/pencil';
import IconPlus from '@tabler/icons-svelte/icons/plus';
import IconRefresh from '@tabler/icons-svelte/icons/refresh';
import IconSearch from '@tabler/icons-svelte/icons/search';
import IconSettings2 from '@tabler/icons-svelte/icons/settings-2';
import IconSun from '@tabler/icons-svelte/icons/sun';
import IconTrash from '@tabler/icons-svelte/icons/trash';
import IconX from '@tabler/icons-svelte/icons/x';
// Hugeicons 4.2.2 advertises per-icon types but does not ship those declarations.
import {
  AlertCircleIcon,
  Maximize01Icon,
  Minimize01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BracesIcon as HugeBracesIcon,
  Calendar03Icon,
  CalendarAdd01Icon,
  Cancel01Icon,
  Clock01Icon,
  Delete02Icon,
  DiceIcon,
  FloppyDiskIcon,
  GithubIcon as HugeGithubIcon,
  LaptopIcon,
  LeftToRightListBulletIcon,
  Menu01Icon,
  Moon02Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  ReloadIcon,
  Search01Icon,
  Settings02Icon,
  SidebarLeftIcon,
  Sun03Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';
import BracketsCurly from 'phosphor-svelte/lib/BracketsCurly';
import Calendar from 'phosphor-svelte/lib/Calendar';
import CalendarDots from 'phosphor-svelte/lib/CalendarDots';
import CaretDown from 'phosphor-svelte/lib/CaretDown';
import CaretRight from 'phosphor-svelte/lib/CaretRight';
import CaretUp from 'phosphor-svelte/lib/CaretUp';
import Check from 'phosphor-svelte/lib/Check';
import Clock from 'phosphor-svelte/lib/Clock';
import DiceFive from 'phosphor-svelte/lib/DiceFive';
import Eye from 'phosphor-svelte/lib/Eye';
import EyeClosed from 'phosphor-svelte/lib/EyeClosed';
import FloppyDisk from 'phosphor-svelte/lib/FloppyDisk';
import GearSix from 'phosphor-svelte/lib/GearSix';
import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
import Laptop from 'phosphor-svelte/lib/Laptop';
import List from 'phosphor-svelte/lib/List';
import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
import Moon from 'phosphor-svelte/lib/Moon';
import Palette from 'phosphor-svelte/lib/Palette';
import Pencil from 'phosphor-svelte/lib/Pencil';
import Plus from 'phosphor-svelte/lib/Plus';
import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
import SidebarSimple from 'phosphor-svelte/lib/SidebarSimple';
import Sun from 'phosphor-svelte/lib/Sun';
import Trash from 'phosphor-svelte/lib/Trash';
import WarningCircle from 'phosphor-svelte/lib/WarningCircle';
import X from 'phosphor-svelte/lib/X';
import RiAddLine from 'remixicon-svelte/icons/add-line';
import RiArrowDownSLine from 'remixicon-svelte/icons/arrow-down-s-line';
import RiArrowRightSLine from 'remixicon-svelte/icons/arrow-right-s-line';
import RiArrowUpSLine from 'remixicon-svelte/icons/arrow-up-s-line';
import RiBracesLine from 'remixicon-svelte/icons/braces-line';
import RiCalendarLine from 'remixicon-svelte/icons/calendar-line';
import RiCalendarScheduleLine from 'remixicon-svelte/icons/calendar-schedule-line';
import RiCheckLine from 'remixicon-svelte/icons/check-line';
import RiCloseLine from 'remixicon-svelte/icons/close-line';
import RiComputerLine from 'remixicon-svelte/icons/computer-line';
import RiDeleteBinLine from 'remixicon-svelte/icons/delete-bin-line';
import RiDice5Line from 'remixicon-svelte/icons/dice-5-line';
import RiErrorWarningLine from 'remixicon-svelte/icons/error-warning-line';
import RiEyeLine from 'remixicon-svelte/icons/eye-line';
import RiEyeOffLine from 'remixicon-svelte/icons/eye-off-line';
import RiGithubLine from 'remixicon-svelte/icons/github-line';
import RiLayoutLeftLine from 'remixicon-svelte/icons/layout-left-line';
import RiListCheck from 'remixicon-svelte/icons/list-check';
import RiMenuLine from 'remixicon-svelte/icons/menu-line';
import RiMoonLine from 'remixicon-svelte/icons/moon-line';
import RiPaletteLine from 'remixicon-svelte/icons/palette-line';
import RiEditLine from 'remixicon-svelte/icons/edit-line';
import RiRestartLine from 'remixicon-svelte/icons/restart-line';
import RiSaveLine from 'remixicon-svelte/icons/save-line';
import RiSearchLine from 'remixicon-svelte/icons/search-line';
import RiSettings3Line from 'remixicon-svelte/icons/settings-3-line';
import RiSunLine from 'remixicon-svelte/icons/sun-line';
import RiTimeLine from 'remixicon-svelte/icons/time-line';
import type { IconLibrary } from './icon-library.svelte';

export const iconNames = [
  'maximize',
  'minimize',
  'braces',
  'calendar-clock',
  'calendar',
  'check',
  'chevron-down',
  'chevron-right',
  'chevron-up',
  'circle-alert',
  'clock',
  'dice',
  'eye',
  'eye-off',
  'github',
  'laptop',
  'list',
  'menu',
  'moon',
  'palette',
  'panels-top-left',
  'pencil',
  'plus',
  'rotate-ccw',
  'save',
  'search',
  'settings',
  'sun',
  'trash',
  'x',
] as const;

export type IconName = (typeof iconNames)[number];

export const componentIcons: Record<Exclude<IconLibrary, 'hugeicons'>, Record<IconName, any>> = {
  lucide: {
    maximize: MaximizeIcon,
    minimize: MinimizeIcon,
    braces: BracesIcon,
    'calendar-clock': CalendarClockIcon,
    calendar: CalendarIcon,
    check: CheckIcon,
    'chevron-down': ChevronDownIcon,
    'chevron-right': ChevronRightIcon,
    'chevron-up': ChevronUpIcon,
    'circle-alert': CircleAlertIcon,
    clock: Clock3Icon,
    dice: Dice5Icon,
    eye: EyeIcon,
    'eye-off': EyeOffIcon,
    github: GithubIcon,
    laptop: LaptopMinimalCheckIcon,
    list: ListIcon,
    menu: MenuIcon,
    moon: MoonIcon,
    palette: PaletteIcon,
    'panels-top-left': PanelsTopLeftIcon,
    pencil: PencilIcon,
    plus: PlusIcon,
    'rotate-ccw': RotateCcwIcon,
    save: SaveIcon,
    search: SearchIcon,
    settings: Settings2Icon,
    sun: SunIcon,
    trash: Trash2Icon,
    x: XIcon,
  },
  tabler: {
    maximize: IconArrowsMaximize,
    minimize: IconArrowsMinimize,
    braces: IconBraces,
    'calendar-clock': IconCalendarClock,
    calendar: IconCalendar,
    check: IconCheck,
    'chevron-down': IconChevronDown,
    'chevron-right': IconChevronRight,
    'chevron-up': IconChevronUp,
    'circle-alert': IconAlertCircle,
    clock: IconClock,
    dice: IconDice5,
    eye: IconEye,
    'eye-off': IconEyeOff,
    github: IconBrandGithub,
    laptop: IconDeviceLaptop,
    list: IconList,
    menu: IconMenu2,
    moon: IconMoon,
    palette: IconPalette,
    'panels-top-left': IconLayoutSidebar,
    pencil: IconPencil,
    plus: IconPlus,
    'rotate-ccw': IconRefresh,
    save: IconDeviceFloppy,
    search: IconSearch,
    settings: IconSettings2,
    sun: IconSun,
    trash: IconTrash,
    x: IconX,
  },
  phosphor: {
    maximize: ArrowsOut,
    minimize: ArrowsIn,
    braces: BracketsCurly,
    'calendar-clock': CalendarDots,
    calendar: Calendar,
    check: Check,
    'chevron-down': CaretDown,
    'chevron-right': CaretRight,
    'chevron-up': CaretUp,
    'circle-alert': WarningCircle,
    clock: Clock,
    dice: DiceFive,
    eye: Eye,
    'eye-off': EyeClosed,
    github: GithubLogo,
    laptop: Laptop,
    list: List,
    menu: List,
    moon: Moon,
    palette: Palette,
    'panels-top-left': SidebarSimple,
    pencil: Pencil,
    plus: Plus,
    'rotate-ccw': ArrowCounterClockwise,
    save: FloppyDisk,
    search: MagnifyingGlass,
    settings: GearSix,
    sun: Sun,
    trash: Trash,
    x: X,
  },
  remixicon: {
    maximize: RiFullscreenLine,
    minimize: RiFullscreenExitLine,
    braces: RiBracesLine,
    'calendar-clock': RiCalendarScheduleLine,
    calendar: RiCalendarLine,
    check: RiCheckLine,
    'chevron-down': RiArrowDownSLine,
    'chevron-right': RiArrowRightSLine,
    'chevron-up': RiArrowUpSLine,
    'circle-alert': RiErrorWarningLine,
    clock: RiTimeLine,
    dice: RiDice5Line,
    eye: RiEyeLine,
    'eye-off': RiEyeOffLine,
    github: RiGithubLine,
    laptop: RiComputerLine,
    list: RiListCheck,
    menu: RiMenuLine,
    moon: RiMoonLine,
    palette: RiPaletteLine,
    'panels-top-left': RiLayoutLeftLine,
    pencil: RiEditLine,
    plus: RiAddLine,
    'rotate-ccw': RiRestartLine,
    save: RiSaveLine,
    search: RiSearchLine,
    settings: RiSettings3Line,
    sun: RiSunLine,
    trash: RiDeleteBinLine,
    x: RiCloseLine,
  },
} as const;

export const hugeIcons = {
  maximize: Maximize01Icon,
  minimize: Minimize01Icon,
  braces: HugeBracesIcon,
  'calendar-clock': CalendarAdd01Icon,
  calendar: Calendar03Icon,
  check: Tick02Icon,
  'chevron-down': ArrowDown01Icon,
  'chevron-right': ArrowRight01Icon,
  'chevron-up': ArrowUp01Icon,
  'circle-alert': AlertCircleIcon,
  clock: Clock01Icon,
  dice: DiceIcon,
  eye: ViewIcon,
  'eye-off': ViewOffIcon,
  github: HugeGithubIcon,
  laptop: LaptopIcon,
  list: LeftToRightListBulletIcon,
  menu: Menu01Icon,
  moon: Moon02Icon,
  palette: PaintBoardIcon,
  'panels-top-left': SidebarLeftIcon,
  pencil: PencilEdit01Icon,
  plus: PlusSignIcon,
  'rotate-ccw': ReloadIcon,
  save: FloppyDiskIcon,
  search: Search01Icon,
  settings: Settings02Icon,
  sun: Sun03Icon,
  trash: Delete02Icon,
  x: Cancel01Icon,
} as const;
