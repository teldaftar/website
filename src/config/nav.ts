import type { Component } from 'vue'
import {
  Home,
  Smartphone,
  Headphones,
  Phone,
  LayoutGrid,
  History,
  HandCoins,
  Landmark,
  Receipt,
  PackagePlus,
  Settings,
  ShoppingCart,
} from 'lucide-vue-next'
import { t } from '@/i18n'

export interface NavItem {
  name: string // route name
  label: string
  icon: Component
}

/** The "new sale" destination — surfaced as a primary action, not a plain tab. */
export const newSaleItem: NavItem = {
  name: 'sale-new',
  label: t('sales.title'),
  icon: ShoppingCart,
}

/**
 * Bottom tab bar (mobile). The center slot is reserved for the raised "Sotuv"
 * action button (rendered separately in BottomNav), so this list has 4 tabs
 * arranged two-on-each-side of it.
 */
export const bottomTabs: NavItem[] = [
  { name: 'dashboard', label: t('nav.dashboard'), icon: Home },
  { name: 'phones', label: t('nav.phones'), icon: Smartphone },
  { name: 'accessories', label: t('nav.accessories'), icon: Headphones },
  { name: 'more', label: t('nav.more'), icon: LayoutGrid },
]

/** Full destination list for the desktop sidebar (excludes the New Sale CTA). */
export const sidebarItems: NavItem[] = [
  { name: 'dashboard', label: t('nav.dashboard'), icon: Home },
  { name: 'phones', label: t('nav.phones'), icon: Smartphone },
  { name: 'accessories', label: t('nav.accessories'), icon: Headphones },
  { name: 'keypad-phones', label: t('nav.keypadPhones'), icon: Phone },
  { name: 'receipts', label: t('nav.receipts'), icon: PackagePlus },
  { name: 'sales', label: t('nav.salesHistory'), icon: History },
  { name: 'debts', label: t('nav.debts'), icon: HandCoins },
  { name: 'expenses', label: t('nav.expenses'), icon: Receipt },
  { name: 'creditors', label: t('nav.creditors'), icon: Landmark },
  { name: 'settings', label: t('nav.settings'), icon: Settings },
]

/** Secondary destinations shown on the mobile "More" screen. */
export const moreItems: NavItem[] = [
  { name: 'keypad-phones', label: t('nav.keypadPhones'), icon: Phone },
  { name: 'receipts', label: t('nav.receipts'), icon: PackagePlus },
  { name: 'sales', label: t('nav.salesHistory'), icon: History },
  { name: 'debts', label: t('nav.debts'), icon: HandCoins },
  { name: 'expenses', label: t('nav.expenses'), icon: Receipt },
  { name: 'creditors', label: t('nav.creditors'), icon: Landmark },
  { name: 'settings', label: t('nav.settings'), icon: Settings },
]
