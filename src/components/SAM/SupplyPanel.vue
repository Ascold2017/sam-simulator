<template>
  <vk-group :config="{
    x: 0,
    y: 0,
  }">
    <vk-rect :config="{
      x: 0,
      y: 0,
      width: 800,
      height: 150,
      fill: 'grey', shadowBlur: 10, cornerRadius: 6,
    }" />
    <!-- Power -->
    <vk-group :config="{ x: 20, y: 20 }">
      <vk-text :config="{
        x: 0,
        y: 10,
        height: 20,
        verticalAlign: 'middle',
        text: 'Питание',
        fill: '#181818',
        fontFamily: 'Russo One, sans-serif',
        fontSize: 12
      }" />
      <vk-circle :config="{
        name: 'powerIndicator',
        x: 95,
        y: 20,
        width: 20,
        height: 20,
        fill: supplyPanel.isEnabledPower ? 'rgb(150, 249, 123)' : 'red',
        shadowBlur: 5
      }" />
      <SAMButton label="Вкл" :x="0" :y="50" name="powerOn" :value="supplyPanel.isEnabledPower"
        @click="supplyPanel.setEnabledPower(true)" />
      <SAMButton label="Выкл" :x="65" :y="50" name="powerOff" :value="!supplyPanel.isEnabledPower"
        @click="supplyPanel.setEnabledPower(false)" />
    </vk-group>

    <!-- SOC mechanization -->
    <vk-group :config="{ x: 160, y: 20 }">
      <vk-text :config="{
        x: 0,
        y: 10,
        height: 20,
        verticalAlign: 'middle',
        text: 'Поиск',
        fill: '#181818',
        fontFamily: 'Russo One, sans-serif',
        fontSize: 12
      }" />
      <vk-circle :config="{
        name: 'rotationIndicator',
        x: 95,
        y: 20,
        width: 20,
        height: 20,
        fill: supplyPanel.isEnabledMainRadar ? 'rgb(150, 249, 123)' : 'red',
        shadowBlur: 5
      }" />
      <SAMButton label="Вкл" :x="0" :y="50" name="rotationOn" :value="supplyPanel.isEnabledMainRadar"
        @click="supplyPanel.setEnablerMainRadar(true)" />
      <SAMButton label="Выкл" :x="65" :y="50" name="rotationOff" :value="!supplyPanel.isEnabledMainRadar"
        @click="supplyPanel.setEnablerMainRadar(false)" />
    </vk-group>

    <!-- SNR antenna -->
    <vk-group :config="{ x: 300, y: 20 }">
      <vk-text :config="{
        x: 0,
        y: 10,
        height: 20,
        verticalAlign: 'middle',
        text: 'Передатчик',
        fill: '#181818',
        fontFamily: 'Russo One, sans-serif',
        fontSize: 12
      }" />
      <vk-circle :config="{
        name: 'targetRadarIndicator',
        x: 95,
        y: 20,
        width: 20,
        height: 20,
        fill: supplyPanel.isEnabledTargetRadarTransmitter ? 'rgb(150, 249, 123)' : 'red',
        shadowBlur: 5
      }" />
      <SAMButton label="Вкл" :x="0" :y="50" name="snrOn" :value="supplyPanel.isEnabledTargetRadarTransmitter"
        @click="supplyPanel.setIsEnabledTargetRadarTransmitter(true)" />
      <SAMButton label="Выкл" :x="65" :y="50" name="snrOff" :value="!supplyPanel.isEnabledTargetRadarTransmitter"
        @click="supplyPanel.setIsEnabledTargetRadarTransmitter(false)" />
    </vk-group>
    

    <vk-rect :config="{
      x: 670,
      y: 20,
      width: 110,
      height: 110,
      fill: 'white',
      stroke: '#181818',
    }" />
    <vk-circle ref="clocksRef"  :config="{
      x: 725,
      y: 75,
      width: 110,
      height: 110,
      stroke: '#181818',
      strokeWidth: 2,
      sceneFunc: drawClock
    }" />
  </vk-group>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type Konva from "konva";
import { useSupplyPanelStore } from '@/store/supplyPanel';
import SAMButton from "./SAMButton.vue";
const clocksRef = ref();
const supplyPanel = useSupplyPanelStore();

const drawClock = (ctx: CanvasRenderingContext2D, shape: Konva.Shape) => {
  shape.clearCache()
  const d = new Date()
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const hoursAngle = ((Math.PI * 2) * ((hour * 5 + (minutes / 60) * 5) / 60)) - ((Math.PI * 2) / 4)
  const minutesAngle = (minutes/60)* 2 * Math.PI - Math.PI/2
  const secondsAngle = (seconds/60)* 2 * Math.PI - Math.PI/2

  const radius = shape.width() / 2 - 8;
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, 2 * Math.PI);
  ctx.fill();
  for (let h = 0; h < 12; h++) {
    const angle = ((2 * Math.PI) / 12) * h - Math.PI / 2;
    const outerX = radius * Math.cos(angle);
    const outerY = radius * Math.sin(angle);
    ctx.beginPath();
    ctx.textAlign = 'center';
    ctx.font = '11px Russo One, sans-serif';
    ctx.fillText((h === 0 ? 12 : h).toString(), outerX, outerY + 4)
  }
  ctx.beginPath();
  ctx.moveTo(0, 0)
  ctx.lineTo(
    30 * Math.cos(hoursAngle),
    30 * Math.sin(hoursAngle),
  )
  ctx.stroke()
  ctx.beginPath();
  ctx.moveTo(0, 0)
  ctx.lineTo(
    40 * Math.cos(minutesAngle),
    40 * Math.sin(minutesAngle),
  )
  ctx.stroke()
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.moveTo(0, 0)
  ctx.lineTo(
    38 * Math.cos(secondsAngle),
    38 * Math.sin(secondsAngle),
  )
  ctx.stroke()
}

onMounted(() => {
  setInterval(() => {
    clocksRef.value.getNode().draw()
  }, 500)
})

</script>