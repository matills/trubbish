import { createApp } from 'vue'
import { createPinia } from 'pinia'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/dm-serif-display/400-italic.css'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'
import { router } from './router'

gsap.registerPlugin(Flip, ScrollTrigger)

createApp(App).use(createPinia()).use(router).mount('#app')
