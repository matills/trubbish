<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'
import { AccountSource, type CatalogEntry, type Category } from '@trubbish/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCheckbox from '@/components/atoms/BaseCheckbox.vue'
import { useGsap } from '@/composables/motion/useGsap'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useCatalogStore } from '@/stores/catalog'

const QUESTIONS: { category: Category; question: string }[] = [
  { category: 'SOCIAL', question: '¿Tuviste perfiles en redes sociales, foros o blogs?' },
  { category: 'MESSAGING', question: '¿Usaste apps de mensajería o chat?' },
  { category: 'SHOPPING', question: '¿Compraste algo por internet alguna vez?' },
  { category: 'STREAMING', question: '¿Te suscribiste a plataformas de series, películas o música?' },
  { category: 'GAMING', question: '¿Jugaste videojuegos en línea o en consola?' },
  { category: 'TRAVEL', question: '¿Reservaste viajes, alojamiento o autos por app?' },
  { category: 'FOOD', question: '¿Pediste comida por delivery?' },
  { category: 'FINANCE', question: '¿Usaste billeteras virtuales, cripto o pagos online?' },
  { category: 'WORK', question: '¿Buscaste trabajo o usaste herramientas de trabajo en línea?' },
  { category: 'EDUCATION', question: '¿Hiciste cursos en línea o usaste apps para aprender?' },
  { category: 'DATING', question: '¿Usaste apps de citas?' },
  { category: 'PRODUCTIVITY', question: '¿Guardaste archivos en la nube o usaste apps de notas y diseño?' },
  { category: 'HEALTH', question: '¿Registraste ejercicio, salud o turnos médicos en alguna app?' },
]

const accounts = useAccountsStore()
const { byCategory } = storeToRefs(useCatalogStore())
const { domains } = storeToRefs(accounts)

const card = ref<HTMLElement | null>(null)
const { run } = useGsap(card)
const step = ref(0)
const answeredYes = ref(false)
const picked = ref<Record<number, boolean>>({})
const added = ref(0)
const saving = ref(false)
const error = ref<string | null>(null)

const current = computed(() => QUESTIONS[step.value])
const options = computed<CatalogEntry[]>(() =>
  current.value ? (byCategory.value.get(current.value.category) ?? []).filter((s) => !domains.value.has(s.domain)) : [],
)
const finished = computed(() => step.value >= QUESTIONS.length)

/** La ficha se da vuelta como una tarjeta de archivo antes de mostrar la próxima pregunta. */
function flipTo(next: () => void) {
  let done = false
  const apply = () => {
    if (done) return
    done = true
    next()
  }
  run(
    () => {
      gsap
        .timeline()
        .to(card.value, { rotateY: 90, duration: 0.22, ease: 'power2.in', onComplete: apply })
        .fromTo(card.value, { rotateY: -90 }, { rotateY: 0, duration: 0.32, ease: 'power3.out' })
    },
    apply,
  )
}

function advance() {
  flipTo(() => {
    step.value++
    answeredYes.value = false
    picked.value = {}
  })
}

async function saveAndAdvance() {
  const chosen = options.value.filter((s) => picked.value[s.id])
  if (chosen.length) {
    saving.value = true
    error.value = null
    try {
      const res = await accounts.bulk(AccountSource.GUIDED, chosen.map((s) => ({ domain: s.domain, name: s.name })))
      added.value += res.created
    } catch (err) {
      error.value = errorMessage(err)
      return
    } finally {
      saving.value = false
    }
  }
  advance()
}

function restart() {
  flipTo(() => {
    step.value = 0
    added.value = 0
  })
}
</script>

<template>
  <div class="memory">
    <div class="memory__meter mono" aria-hidden="true">
      <span v-for="(_, i) in QUESTIONS" :key="i" class="tick" :class="{ on: i < step, now: i === step }" />
    </div>

    <div class="memory__stage">
      <div ref="card" class="qcard">
        <template v-if="!finished && current">
          <p class="eyebrow">Pregunta {{ step + 1 }} de {{ QUESTIONS.length }}</p>
          <h3>{{ current.question }}</h3>

          <div v-if="!answeredYes" class="qcard__actions">
            <BaseButton @click="answeredYes = true">Sí</BaseButton>
            <BaseButton variant="outline" @click="advance">No</BaseButton>
          </div>

          <template v-else>
            <p class="mono">Marcá las que recuerdes:</p>
            <ul v-if="options.length" class="qcard__options">
              <li v-for="s in options" :key="s.id">
                <BaseCheckbox v-model="picked[s.id]" :label="s.name" />
              </li>
            </ul>
            <p v-else class="mono">Ya agregaste todas las de este rubro.</p>
            <p class="mono qcard__hint">¿Falta alguna? Agregala a mano desde el catálogo.</p>
            <div class="qcard__actions">
              <BaseButton :loading="saving" @click="saveAndAdvance">Seguir</BaseButton>
            </div>
          </template>
        </template>

        <template v-else>
          <p class="eyebrow">Fin del cuestionario</p>
          <h3>Recordaste {{ added }} {{ added === 1 ? 'cuenta' : 'cuentas' }}</h3>
          <p>Ya están en el expediente. Podés repetirlo otro día: la memoria trae cosas de a poco.</p>
          <div class="qcard__actions">
            <BaseButton :to="{ name: 'dossier' }">Ver el expediente</BaseButton>
            <BaseButton variant="outline" @click="restart">Empezar de nuevo</BaseButton>
          </div>
        </template>
        <p v-if="error" class="mono" role="alert">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memory {
  display: grid;
  gap: 16px;
}

.memory__meter {
  display: flex;
  gap: 4px;
}

.tick {
  flex: 1;
  height: 8px;
  border: 2px solid var(--ink);
}

.tick.on {
  background: var(--ink);
}

.tick.now {
  background-image: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 5px);
}

.memory__stage {
  perspective: 1200px;
}

.qcard {
  display: grid;
  gap: 18px;
  padding: clamp(20px, 4vw, 40px);
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
  background:
    linear-gradient(var(--ink-10), var(--ink-10)) 0 64px / 100% 1px no-repeat,
    var(--paper);
  transform-style: preserve-3d;
  min-height: 320px;
  align-content: start;
}

.qcard h3 {
  font-size: clamp(28px, 4.5vw, 48px);
  font-stretch: 78%;
  max-width: 22ch;
}

.qcard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.qcard__options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 10px 16px;
}

.qcard__hint {
  font-size: 13px;
  color: var(--ink-70);
}
</style>
