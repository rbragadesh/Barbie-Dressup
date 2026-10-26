// Entry point: registers screens, starts on the welcome or home screen, and
// registers the service worker so the app works offline once installed.

import { store } from './store.js';
import { registerScreen, go, celebrate } from './ui.js';
import { checkRewards, onAnnounce } from './game.js';
import { home, welcome, settings } from './screens/home.js';
import studio from './screens/studio.js';
import mapScreen from './screens/map.js';
import tripScreen from './screens/trip.js';
import { passport, words, practice, quiz, album } from './screens/collections.js';
import { show, runway, boutique, beliefs, stickers } from './screens/extras.js';
import { memory, suitcase, mapquest } from './screens/minigames.js';

registerScreen('home', home);
registerScreen('welcome', welcome);
registerScreen('settings', settings);
registerScreen('studio', studio);
registerScreen('map', mapScreen);
registerScreen('trip', tripScreen);
registerScreen('passport', passport);
registerScreen('words', words);
registerScreen('practice', practice);
registerScreen('quiz', quiz);
registerScreen('album', album);
registerScreen('show', show);
registerScreen('runway', runway);
registerScreen('boutique', boutique);
registerScreen('beliefs', beliefs);
registerScreen('stickers', stickers);
registerScreen('memory', memory);
registerScreen('suitcase', suitcase);
registerScreen('mapquest', mapquest);

// Stickers and rank-ups are checked after every change and announced with a banner.
onAnnounce(celebrate);
store.onChange(checkRewards);

go(store.state.onboarded ? 'home' : 'welcome');

// Stop iOS from zooming on double-tap or pinch while a child is playing.
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
}
