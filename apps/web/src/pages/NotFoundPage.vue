<script setup lang="ts">
import BaseButton from '@/components/atoms/BaseButton.vue'
import OpArt from '@/components/atoms/OpArt.vue'
</script>

<template>
  <section class="lost">
    <OpArt class="lost__op" variant="moire" />
    <div class="lost__box">
      <p class="eyebrow">Error 404 · Rollo extraviado</p>
      <h1>Esta escena <span class="serif">no existe</span></h1>
      <BaseButton to="/">Volver al inicio</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.lost {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 70vh;
  overflow: hidden;
}

.lost__op {
  position: absolute;
  inset: 0;
}

.lost__box {
  position: relative;
  display: grid;
  gap: 16px;
  justify-items: center;
  margin: 16px;
  padding: 32px;
  background: var(--paper);
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.lost__box h1 {
  font-size: clamp(40px, 7vw, 72px);
  font-stretch: 75%;
}
</style>
