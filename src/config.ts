/**
 * Build-time constants that are a deliberate choice rather than a setting.
 *
 * Nothing here is stored, migrated or user-editable — a value changes by
 * editing this file and shipping a build, which is exactly right for things
 * that are the same for everyone who opens the app.
 */

/**
 * Where the footer's "Buy me a coffee" link points.
 *
 * Empty string means "no page yet", and every render site treats that as
 * "show nothing" rather than as a dead link — so the slot ships dormant.
 * To turn it on: paste the URL between the quotes, e.g.
 * 'https://buymeacoffee.com/yourname', and deploy. Nothing else to change.
 */
export const BUY_ME_A_COFFEE_URL: string = ''
