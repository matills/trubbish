import type { Category, Difficulty } from '@borrar/shared'

// Catálogo de la Fase 0. Los enlaces se cargaron a mano y los sitios los cambian
// seguido: si un enlace no lleva a la página de borrado, `deleteUrl` apunta a la
// ayuda oficial y `steps` explica el camino. Revisar periódicamente.

export interface CatalogSeed {
  slug: string
  name: string
  domain: string
  aliases: string[]
  category: Category
  difficulty: Difficulty
  deleteUrl: string | null
  recoveryUrl: string | null
  privacyEmail: string | null
  steps: string | null
}

interface Extra {
  aliases?: string[]
  recovery?: string
  privacy?: string
  steps?: string
}

function s(
  slug: string,
  name: string,
  domain: string,
  category: Category,
  difficulty: Difficulty,
  deleteUrl: string | null,
  extra: Extra = {},
): CatalogSeed {
  return {
    slug,
    name,
    domain,
    aliases: extra.aliases ?? [],
    category,
    difficulty,
    deleteUrl,
    recoveryUrl: extra.recovery ?? null,
    privacyEmail: extra.privacy ?? null,
    steps: extra.steps ?? null,
  }
}

export const CATALOG: CatalogSeed[] = [
  // Redes sociales
  s('google', 'Google', 'google.com', 'PRODUCTIVITY', 'EASY', 'https://myaccount.google.com/deleteaccount', {
    aliases: ['gmail.com', 'youtube.com', 'accounts.google.com', 'google.com.ar'],
    recovery: 'https://accounts.google.com/signin/recovery',
    steps: 'Antes de borrar, descargá tus datos desde Google Takeout. Borrar la cuenta elimina Gmail, Drive, Fotos y YouTube.',
  }),
  s('facebook', 'Facebook', 'facebook.com', 'SOCIAL', 'MEDIUM', 'https://www.facebook.com/help/delete_account', {
    aliases: ['fb.com', 'm.facebook.com', 'messenger.com'],
    recovery: 'https://www.facebook.com/login/identify',
    steps: 'Centro de cuentas › Datos personales › Propiedad y control de la cuenta › Desactivación o eliminación. Queda 30 días en pausa antes de borrarse.',
  }),
  s('instagram', 'Instagram', 'instagram.com', 'SOCIAL', 'MEDIUM', 'https://www.instagram.com/accounts/remove/request/permanent/', {
    recovery: 'https://www.instagram.com/accounts/password/reset/',
    steps: 'Se gestiona desde el Centro de cuentas de Meta. Hay 30 días para arrepentirse.',
  }),
  s('threads', 'Threads', 'threads.net', 'SOCIAL', 'MEDIUM', 'https://help.instagram.com/', {
    aliases: ['threads.com'],
    steps: 'En la app: Configuración › Cuenta › Eliminar perfil. Borrar Threads no borra Instagram.',
  }),
  s('x', 'X (Twitter)', 'x.com', 'SOCIAL', 'EASY', 'https://x.com/settings/deactivate', {
    aliases: ['twitter.com'],
    recovery: 'https://x.com/i/flow/password_reset',
    steps: 'Se desactiva y se borra pasados 30 días sin volver a entrar.',
  }),
  s('tiktok', 'TikTok', 'tiktok.com', 'SOCIAL', 'MEDIUM', 'https://support.tiktok.com/es/account-and-privacy/deleting-an-account', {
    steps: 'En la app: Perfil › Menú › Configuración y privacidad › Cuenta › Desactivar o eliminar cuenta.',
  }),
  s('linkedin', 'LinkedIn', 'linkedin.com', 'WORK', 'EASY', 'https://www.linkedin.com/psettings/close-account', {
    recovery: 'https://www.linkedin.com/checkpoint/rp/request-password-reset',
  }),
  s('reddit', 'Reddit', 'reddit.com', 'SOCIAL', 'EASY', 'https://www.reddit.com/settings/account', {
    recovery: 'https://www.reddit.com/password',
    steps: 'Configuración › Cuenta › Eliminar cuenta. Los posts quedan publicados como [deleted] salvo que los borres antes.',
  }),
  s('pinterest', 'Pinterest', 'pinterest.com', 'SOCIAL', 'EASY', 'https://www.pinterest.com/settings/account-settings', {
    recovery: 'https://www.pinterest.com/password/reset/',
  }),
  s('snapchat', 'Snapchat', 'snapchat.com', 'SOCIAL', 'EASY', 'https://accounts.snapchat.com/accounts/delete_account'),
  s('tumblr', 'Tumblr', 'tumblr.com', 'SOCIAL', 'EASY', 'https://www.tumblr.com/settings/account'),
  s('bluesky', 'Bluesky', 'bsky.app', 'SOCIAL', 'EASY', 'https://bsky.app/settings/account'),
  s('quora', 'Quora', 'quora.com', 'SOCIAL', 'EASY', 'https://www.quora.com/settings/privacy'),
  s('medium', 'Medium', 'medium.com', 'SOCIAL', 'EASY', 'https://medium.com/me/settings/security'),
  s('flickr', 'Flickr', 'flickr.com', 'SOCIAL', 'EASY', 'https://www.flickr.com/account'),
  s('deviantart', 'DeviantArt', 'deviantart.com', 'SOCIAL', 'EASY', 'https://www.deviantart.com/settings/deactivation'),
  s('9gag', '9GAG', '9gag.com', 'SOCIAL', 'EASY', 'https://9gag.com/settings/account'),
  s('disqus', 'Disqus', 'disqus.com', 'SOCIAL', 'EASY', 'https://disqus.com/home/settings/account/'),
  s('vk', 'VK', 'vk.com', 'SOCIAL', 'MEDIUM', 'https://vk.com/settings'),

  // Mensajería
  s('whatsapp', 'WhatsApp', 'whatsapp.com', 'MESSAGING', 'EASY', 'https://faq.whatsapp.com/2138577903196467', {
    steps: 'En la app: Ajustes › Cuenta › Eliminar cuenta. Se registra con el teléfono, no con el correo.',
  }),
  s('telegram', 'Telegram', 'telegram.org', 'MESSAGING', 'EASY', 'https://my.telegram.org/auth?to=delete'),
  s('discord', 'Discord', 'discord.com', 'MESSAGING', 'EASY', 'https://support.discord.com/hc/es/articles/212500837', {
    aliases: ['discordapp.com'],
    steps: 'Ajustes de usuario › Mi cuenta › Eliminar cuenta. Si sos dueño de un servidor, primero transferilo o borralo.',
  }),
  s('signal', 'Signal', 'signal.org', 'MESSAGING', 'EASY', 'https://support.signal.org/hc/es/articles/360007061452', {
    steps: 'En la app: Ajustes › Cuenta › Eliminar cuenta.',
  }),
  s('slack', 'Slack', 'slack.com', 'WORK', 'HARD', 'https://slack.com/help/articles/203953146', {
    steps: 'La cuenta existe por espacio de trabajo: hay que desactivarla en cada uno, y el administrador puede retener los datos.',
  }),
  s('zoom', 'Zoom', 'zoom.us', 'WORK', 'EASY', 'https://zoom.us/account'),

  // Productividad y nube
  s('microsoft', 'Microsoft (Outlook, Xbox, Skype)', 'microsoft.com', 'PRODUCTIVITY', 'MEDIUM', 'https://account.live.com/closeaccount.aspx', {
    aliases: ['live.com', 'outlook.com', 'hotmail.com', 'xbox.com', 'skype.com', 'office.com'],
    recovery: 'https://account.live.com/password/reset',
    steps: 'La cuenta queda marcada para cierre y se borra a los 60 días.',
  }),
  s('apple', 'Apple ID', 'apple.com', 'PRODUCTIVITY', 'MEDIUM', 'https://privacy.apple.com/', {
    aliases: ['icloud.com', 'appleid.apple.com'],
    recovery: 'https://iforgot.apple.com',
    steps: 'Datos y privacidad › Solicitar la eliminación de tu cuenta. Apple verifica la solicitud y tarda hasta 7 días.',
  }),
  s('yahoo', 'Yahoo', 'yahoo.com', 'PRODUCTIVITY', 'EASY', 'https://edit.yahoo.com/config/delete_user'),
  s('dropbox', 'Dropbox', 'dropbox.com', 'PRODUCTIVITY', 'EASY', 'https://www.dropbox.com/account/delete', {
    recovery: 'https://www.dropbox.com/forgot',
  }),
  s('notion', 'Notion', 'notion.so', 'PRODUCTIVITY', 'EASY', 'https://www.notion.so/help/delete-my-account', {
    aliases: ['notion.com'],
    steps: 'Configuración › Mi cuenta › Eliminar mi cuenta.',
  }),
  s('evernote', 'Evernote', 'evernote.com', 'PRODUCTIVITY', 'MEDIUM', 'https://help.evernote.com/hc/es/articles/208313748'),
  s('atlassian', 'Atlassian (Trello, Jira)', 'atlassian.com', 'WORK', 'MEDIUM', 'https://id.atlassian.com/manage-profile/account-preferences', {
    aliases: ['trello.com', 'atlassian.net', 'bitbucket.org'],
  }),
  s('canva', 'Canva', 'canva.com', 'PRODUCTIVITY', 'EASY', 'https://www.canva.com/settings/your-account'),
  s('adobe', 'Adobe', 'adobe.com', 'PRODUCTIVITY', 'MEDIUM', 'https://account.adobe.com/privacy', {
    steps: 'Si tenés una suscripción activa, cancelala primero: con plan vigente no deja borrar.',
  }),
  s('grammarly', 'Grammarly', 'grammarly.com', 'PRODUCTIVITY', 'EASY', 'https://account.grammarly.com/account'),
  s('openai', 'ChatGPT (OpenAI)', 'openai.com', 'PRODUCTIVITY', 'EASY', 'https://help.openai.com/es-419/articles/6378407', {
    aliases: ['chatgpt.com'],
    steps: 'Configuración › Controles de datos › Eliminar cuenta.',
  }),
  s('figma', 'Figma', 'figma.com', 'WORK', 'EASY', 'https://help.figma.com/hc/es/articles/360040049534'),
  s('wetransfer', 'WeTransfer', 'wetransfer.com', 'PRODUCTIVITY', 'EASY', 'https://help.wetransfer.com/'),
  s('proton', 'Proton', 'proton.me', 'PRODUCTIVITY', 'EASY', 'https://account.proton.me/', {
    aliases: ['protonmail.com'],
    steps: 'Configuración › Cuenta › Eliminar cuenta.',
  }),
  s('github', 'GitHub', 'github.com', 'WORK', 'EASY', 'https://github.com/settings/admin', {
    recovery: 'https://github.com/password_reset',
  }),
  s('gitlab', 'GitLab', 'gitlab.com', 'WORK', 'EASY', 'https://gitlab.com/-/profile/account'),
  s('stackoverflow', 'Stack Overflow', 'stackoverflow.com', 'WORK', 'MEDIUM', 'https://stackoverflow.com/help/deleting-account', {
    aliases: ['stackexchange.com'],
  }),
  s('wordpress', 'WordPress.com', 'wordpress.com', 'PRODUCTIVITY', 'EASY', 'https://wordpress.com/me/account/close', {
    aliases: ['gravatar.com'],
  }),
  s('samsung', 'Samsung Account', 'samsung.com', 'PRODUCTIVITY', 'MEDIUM', 'https://account.samsung.com/'),
  s('xiaomi', 'Xiaomi Account', 'mi.com', 'PRODUCTIVITY', 'MEDIUM', 'https://account.xiaomi.com/'),

  // Compras
  s('amazon', 'Amazon', 'amazon.com', 'SHOPPING', 'MEDIUM', 'https://www.amazon.com/privacy/data-deletion', {
    aliases: ['amazon.es', 'amazon.com.br', 'primevideo.com', 'audible.com'],
    recovery: 'https://www.amazon.com/ap/forgotpassword',
    steps: 'Cerrar la cuenta de Amazon también cierra Prime Video, Kindle y Audible.',
  }),
  s('mercadolibre', 'Mercado Libre', 'mercadolibre.com.ar', 'SHOPPING', 'MEDIUM', 'https://www.mercadolibre.com.ar/ayuda', {
    aliases: ['mercadolibre.com', 'mercadolivre.com.br'],
    steps: 'Mi cuenta › Configuración › Datos de tu cuenta › Cancelar tu cuenta. No deja si hay compras, ventas o saldo pendientes.',
  }),
  s('mercadopago', 'Mercado Pago', 'mercadopago.com.ar', 'FINANCE', 'HARD', 'https://www.mercadopago.com.ar/ayuda', {
    aliases: ['mercadopago.com'],
    steps: 'Hay que dejar el saldo en cero y no tener créditos activos. Comparte cuenta con Mercado Libre.',
  }),
  s('ebay', 'eBay', 'ebay.com', 'SHOPPING', 'MEDIUM', 'https://www.ebay.com/help/account/changing-account-settings/closing-account?id=4171'),
  s('aliexpress', 'AliExpress', 'aliexpress.com', 'SHOPPING', 'MEDIUM', 'https://service.aliexpress.com/', {
    steps: 'Cuenta › Configuración › Eliminar cuenta (en la app).',
  }),
  s('shein', 'SHEIN', 'shein.com', 'SHOPPING', 'MEDIUM', 'https://www.shein.com/', {
    steps: 'En la app: Yo › Configuración › Gestión de cuenta › Eliminar cuenta.',
  }),
  s('temu', 'Temu', 'temu.com', 'SHOPPING', 'MEDIUM', 'https://www.temu.com/', {
    steps: 'Tú › Configuración › Privacidad › Eliminar tu cuenta de Temu.',
  }),
  s('etsy', 'Etsy', 'etsy.com', 'SHOPPING', 'EASY', 'https://www.etsy.com/your/account', {
    steps: 'Configuración › Cuenta › Cerrar cuenta.',
  }),
  s('vinted', 'Vinted', 'vinted.com', 'SHOPPING', 'EASY', 'https://www.vinted.com/settings/account'),
  s('wish', 'Wish', 'wish.com', 'SHOPPING', 'MEDIUM', 'https://www.wish.com/settings'),
  s('falabella', 'Falabella', 'falabella.com', 'SHOPPING', 'HARD', null, {
    steps: 'No tiene botón de borrado: corresponde pedido de supresión.',
  }),
  s('dafiti', 'Dafiti', 'dafiti.com.ar', 'SHOPPING', 'HARD', null, {
    steps: 'No tiene botón de borrado: corresponde pedido de supresión.',
  }),
  s('fravega', 'Frávega', 'fravega.com', 'SHOPPING', 'HARD', null, {
    steps: 'No tiene botón de borrado: corresponde pedido de supresión.',
  }),

  // Streaming y música
  s('netflix', 'Netflix', 'netflix.com', 'STREAMING', 'HARD', 'https://www.netflix.com/cancelplan', {
    recovery: 'https://www.netflix.com/LoginHelp',
    privacy: 'privacy@netflix.com',
    steps: 'Cancelar el plan no borra los datos: se eliminan a los 10 meses o pidiéndolo por correo a privacidad.',
  }),
  s('spotify', 'Spotify', 'spotify.com', 'STREAMING', 'EASY', 'https://support.spotify.com/close-account/', {
    recovery: 'https://accounts.spotify.com/password-reset',
  }),
  s('disneyplus', 'Disney+', 'disneyplus.com', 'STREAMING', 'MEDIUM', 'https://www.disneyplus.com/account', {
    steps: 'Cancelá la suscripción en Cuenta; el borrado de datos se pide a la ayuda de Disney.',
  }),
  s('max', 'Max (HBO)', 'max.com', 'STREAMING', 'MEDIUM', 'https://help.max.com/', {
    aliases: ['hbomax.com'],
  }),
  s('paramount', 'Paramount+', 'paramountplus.com', 'STREAMING', 'MEDIUM', 'https://www.paramountplus.com/account/'),
  s('crunchyroll', 'Crunchyroll', 'crunchyroll.com', 'STREAMING', 'MEDIUM', 'https://help.crunchyroll.com/'),
  s('deezer', 'Deezer', 'deezer.com', 'STREAMING', 'EASY', 'https://www.deezer.com/account', {
    steps: 'Configuración de la cuenta › Gestionar mi cuenta › Eliminar mi cuenta.',
  }),
  s('soundcloud', 'SoundCloud', 'soundcloud.com', 'STREAMING', 'EASY', 'https://soundcloud.com/settings/account'),
  s('tidal', 'TIDAL', 'tidal.com', 'STREAMING', 'MEDIUM', 'https://support.tidal.com/'),
  s('lastfm', 'Last.fm', 'last.fm', 'STREAMING', 'EASY', 'https://www.last.fm/settings/account'),
  s('twitch', 'Twitch', 'twitch.tv', 'STREAMING', 'EASY', 'https://www.twitch.tv/user/delete-account', {
    recovery: 'https://www.twitch.tv/user/account-recovery',
  }),
  s('vimeo', 'Vimeo', 'vimeo.com', 'STREAMING', 'EASY', 'https://vimeo.com/settings/account'),

  // Juegos
  s('steam', 'Steam', 'steampowered.com', 'GAMING', 'MEDIUM', 'https://help.steampowered.com/es/wizard/HelpDeleteAccount', {
    aliases: ['steamcommunity.com'],
    recovery: 'https://help.steampowered.com/es/wizard/HelpWithLogin',
    steps: 'Se pierden todos los juegos comprados. El soporte pide confirmación y hay 30 días de espera.',
  }),
  s('epic', 'Epic Games', 'epicgames.com', 'GAMING', 'EASY', 'https://www.epicgames.com/account/general'),
  s('playstation', 'PlayStation Network', 'playstation.com', 'GAMING', 'HARD', 'https://www.playstation.com/es-ar/support/account/close-account-psn/', {
    aliases: ['sonyentertainmentnetwork.com'],
    steps: 'Solo se puede cerrar contactando al soporte de PlayStation.',
  }),
  s('nintendo', 'Nintendo Account', 'nintendo.com', 'GAMING', 'EASY', 'https://accounts.nintendo.com/'),
  s('riot', 'Riot Games', 'riotgames.com', 'GAMING', 'MEDIUM', 'https://support.riotgames.com/'),
  s('roblox', 'Roblox', 'roblox.com', 'GAMING', 'HARD', 'https://www.roblox.com/support', {
    steps: 'No hay botón: se pide al soporte con un formulario.',
  }),
  s('ea', 'EA', 'ea.com', 'GAMING', 'HARD', 'https://help.ea.com/'),
  s('ubisoft', 'Ubisoft', 'ubisoft.com', 'GAMING', 'MEDIUM', 'https://account.ubisoft.com/'),
  s('blizzard', 'Battle.net', 'battle.net', 'GAMING', 'MEDIUM', 'https://us.battle.net/support/'),

  // Viajes y movilidad
  s('airbnb', 'Airbnb', 'airbnb.com', 'TRAVEL', 'EASY', 'https://www.airbnb.com/account-settings/privacy-and-sharing'),
  s('booking', 'Booking.com', 'booking.com', 'TRAVEL', 'EASY', 'https://account.booking.com/', {
    steps: 'Mi cuenta › Configuración › Seguridad › Eliminar cuenta.',
  }),
  s('despegar', 'Despegar', 'despegar.com.ar', 'TRAVEL', 'HARD', null, {
    aliases: ['despegar.com'],
    steps: 'No tiene botón de borrado: corresponde pedido de supresión.',
  }),
  s('tripadvisor', 'Tripadvisor', 'tripadvisor.com', 'TRAVEL', 'EASY', 'https://www.tripadvisor.com/Settings-cs'),
  s('expedia', 'Expedia', 'expedia.com', 'TRAVEL', 'MEDIUM', 'https://www.expedia.com/dsr', {
    aliases: ['hotels.com'],
  }),
  s('uber', 'Uber', 'uber.com', 'TRAVEL', 'EASY', 'https://help.uber.com/riders/article/delete-my-uber-account', {
    steps: 'Borra también Uber Eats. Hay 30 días para reactivar.',
  }),
  s('cabify', 'Cabify', 'cabify.com', 'TRAVEL', 'MEDIUM', 'https://help.cabify.com/'),
  s('didi', 'DiDi', 'didiglobal.com', 'TRAVEL', 'MEDIUM', null, {
    steps: 'En la app: Configuración › Seguridad de la cuenta › Eliminar cuenta.',
  }),
  s('aerolineas', 'Aerolíneas Argentinas', 'aerolineas.com.ar', 'TRAVEL', 'HARD', null, {
    steps: 'El programa de millas no tiene baja automática: corresponde pedido de supresión.',
  }),
  s('couchsurfing', 'Couchsurfing', 'couchsurfing.com', 'TRAVEL', 'EASY', 'https://www.couchsurfing.com/users/edit/account'),

  // Comida
  s('pedidosya', 'PedidosYa', 'pedidosya.com.ar', 'FOOD', 'MEDIUM', null, {
    aliases: ['pedidosya.com'],
    steps: 'En la app: Perfil › Información personal › Eliminar cuenta.',
  }),
  s('rappi', 'Rappi', 'rappi.com.ar', 'FOOD', 'MEDIUM', null, {
    aliases: ['rappi.com'],
    steps: 'En la app: Perfil › Configuración › Eliminar cuenta.',
  }),
  s('glovo', 'Glovo', 'glovoapp.com', 'FOOD', 'MEDIUM', null, {
    steps: 'En la app: Perfil › Configuración › Eliminar cuenta.',
  }),

  // Finanzas
  s('paypal', 'PayPal', 'paypal.com', 'FINANCE', 'MEDIUM', 'https://www.paypal.com/myaccount/settings/', {
    recovery: 'https://www.paypal.com/authflow/password-recovery/',
    steps: 'Configuración › Cuenta › Cerrar tu cuenta. Retirá el saldo antes.',
  }),
  s('wise', 'Wise', 'wise.com', 'FINANCE', 'MEDIUM', 'https://wise.com/help/'),
  s('revolut', 'Revolut', 'revolut.com', 'FINANCE', 'MEDIUM', null, {
    steps: 'En la app: Perfil › Ajustes › Cerrar cuenta. Retirá el saldo antes.',
  }),
  s('uala', 'Ualá', 'uala.com.ar', 'FINANCE', 'HARD', null, {
    steps: 'Se da de baja por el chat de ayuda de la app, con saldo en cero y sin préstamos.',
  }),
  s('binance', 'Binance', 'binance.com', 'FINANCE', 'MEDIUM', 'https://www.binance.com/es/support'),

  // Trabajo y estudio
  s('indeed', 'Indeed', 'indeed.com', 'WORK', 'EASY', 'https://secure.indeed.com/settings/account'),
  s('bumeran', 'Bumeran', 'bumeran.com.ar', 'WORK', 'MEDIUM', null, {
    steps: 'Mi cuenta › Configuración › Eliminar cuenta.',
  }),
  s('computrabajo', 'Computrabajo', 'computrabajo.com', 'WORK', 'MEDIUM', null),
  s('glassdoor', 'Glassdoor', 'glassdoor.com', 'WORK', 'EASY', 'https://www.glassdoor.com/member/account/settings'),
  s('upwork', 'Upwork', 'upwork.com', 'WORK', 'MEDIUM', 'https://support.upwork.com/'),
  s('fiverr', 'Fiverr', 'fiverr.com', 'WORK', 'MEDIUM', 'https://www.fiverr.com/settings'),
  s('workana', 'Workana', 'workana.com', 'WORK', 'MEDIUM', null),
  s('coursera', 'Coursera', 'coursera.org', 'EDUCATION', 'EASY', 'https://www.coursera.org/account-settings'),
  s('udemy', 'Udemy', 'udemy.com', 'EDUCATION', 'EASY', 'https://www.udemy.com/user/close-account/'),
  s('duolingo', 'Duolingo', 'duolingo.com', 'EDUCATION', 'EASY', 'https://drive-thru.duolingo.com/'),
  s('platzi', 'Platzi', 'platzi.com', 'EDUCATION', 'MEDIUM', null),
  s('domestika', 'Domestika', 'domestika.org', 'EDUCATION', 'MEDIUM', 'https://www.domestika.org/es/help'),
  s('khanacademy', 'Khan Academy', 'khanacademy.org', 'EDUCATION', 'EASY', 'https://www.khanacademy.org/settings'),

  // Citas
  s('tinder', 'Tinder', 'tinder.com', 'DATING', 'EASY', 'https://www.help.tinder.com/hc/es/articles/115003342023', {
    steps: 'Borrar la app no borra la cuenta: Configuración › Eliminar cuenta.',
  }),
  s('bumble', 'Bumble', 'bumble.com', 'DATING', 'EASY', null, {
    steps: 'En la app: Configuración › Eliminar cuenta.',
  }),
  s('badoo', 'Badoo', 'badoo.com', 'DATING', 'EASY', 'https://badoo.com/settings'),
  s('happn', 'happn', 'happn.com', 'DATING', 'EASY', null, {
    steps: 'En la app: Configuración › Eliminar cuenta.',
  }),

  // Otros
  s('strava', 'Strava', 'strava.com', 'HEALTH', 'EASY', 'https://www.strava.com/athlete/delete_your_account'),
  s('myfitnesspal', 'MyFitnessPal', 'myfitnesspal.com', 'HEALTH', 'MEDIUM', 'https://support.myfitnesspal.com/'),
  s('garmin', 'Garmin Connect', 'garmin.com', 'HEALTH', 'MEDIUM', 'https://www.garmin.com/es-AR/account/datamanagement/'),
  s('doctoralia', 'Doctoralia', 'doctoralia.com.ar', 'HEALTH', 'MEDIUM', null),
  s('goodreads', 'Goodreads', 'goodreads.com', 'OTHER', 'EASY', 'https://www.goodreads.com/user/destroy'),
  s('letterboxd', 'Letterboxd', 'letterboxd.com', 'OTHER', 'EASY', 'https://letterboxd.com/settings/'),
  s('wattpad', 'Wattpad', 'wattpad.com', 'OTHER', 'EASY', 'https://www.wattpad.com/user_close'),
  s('eventbrite', 'Eventbrite', 'eventbrite.com', 'OTHER', 'EASY', 'https://www.eventbrite.com/account-close/'),
  s('meetup', 'Meetup', 'meetup.com', 'OTHER', 'EASY', 'https://www.meetup.com/account/'),
  s('change', 'Change.org', 'change.org', 'OTHER', 'MEDIUM', 'https://help.change.org/'),
  s('patreon', 'Patreon', 'patreon.com', 'OTHER', 'MEDIUM', 'https://www.patreon.com/settings/account'),
  s('kickstarter', 'Kickstarter', 'kickstarter.com', 'OTHER', 'MEDIUM', 'https://www.kickstarter.com/settings/account'),
  s('yelp', 'Yelp', 'yelp.com', 'OTHER', 'EASY', 'https://www.yelp.com/support'),
  s('imgur', 'Imgur', 'imgur.com', 'OTHER', 'EASY', 'https://imgur.com/account/settings'),
  s('wikipedia', 'Wikipedia', 'wikipedia.org', 'OTHER', 'IMPOSSIBLE', 'https://meta.wikimedia.org/wiki/Right_to_vanish', {
    steps: 'Las cuentas no se borran: se puede pedir el "derecho a desaparecer" (renombrar y bloquear).',
  }),
  s('arca', 'ARCA (ex AFIP)', 'arca.gob.ar', 'GOVERNMENT', 'IMPOSSIBLE', null, {
    aliases: ['afip.gob.ar'],
    steps: 'Organismo público con obligación legal de conservar los datos. Revisá solo que tus datos estén actualizados.',
  }),
  s('miargentina', 'Mi Argentina', 'argentina.gob.ar', 'GOVERNMENT', 'IMPOSSIBLE', null, {
    steps: 'Cuenta del Estado vinculada al DNI. No se borra.',
  }),
]
