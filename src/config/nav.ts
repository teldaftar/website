import type { Component } from 'vue'
import {
  Home,
  Smartphone,
  Headphones,
  LayoutGrid,
  History,
  HandCoins,
  Receipt,
  Settings,
} from 'lucide-vue-next'
import { t } from '@/i18n'

export interface NavItem {
  name: string // route name
  label: string
  icon: Component
}

/**
 * Bottom tab bar (mobile). Selling happens directly from the Telefonlar /
 * Aksessuarlar screens (per-product), so there's no dedicated "new sale" tab.
 */
export const bottomTabs: NavItem[] = [
  { name: 'dashboard', label: t('nav.dashboard'), icon: Home },
  { name: 'phones', label: t('nav.phones'), icon: Smartphone },
  { name: 'accessories', label: t('nav.accessories'), icon: Headphones },
  { name: 'more', label: t('nav.more'), icon: LayoutGrid },
]

/** Full destination list for the desktop sidebar. */
export const sidebarItems: NavItem[] = [
  { name: 'dashboard', label: t('nav.dashboard'), icon: Home },
  { name: 'phones', label: t('nav.phones'), icon: Smartphone },
  { name: 'accessories', label: t('nav.accessories'), icon: Headphones },
  { name: 'sales', label: t('nav.salesHistory'), icon: History },
  { name: 'debts', label: t('nav.debts'), icon: HandCoins },
  { name: 'expenses', label: t('nav.expenses'), icon: Receipt },
  { name: 'settings', label: t('nav.settings'), icon: Settings },
]

/** Secondary destinations shown on the mobile "More" screen. */
export const moreItems: NavItem[] = [
  { name: 'sales', label: t('nav.salesHistory'), icon: History },
  { name: 'debts', label: t('nav.debts'), icon: HandCoins },
  { name: 'expenses', label: t('nav.expenses'), icon: Receipt },
  { name: 'settings', label: t('nav.settings'), icon: Settings },
]
