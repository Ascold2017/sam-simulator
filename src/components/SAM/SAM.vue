<template>
  <v-container fluid class="px-6 ">
    <div class="d-flex justify-center">
      <vk-stage :config="{ width: 1410, height: 900 }">
        <vk-layer>
          <SupplyPanel />
          <MainRadarPanel />
          <ParamsPanel />
          <DistancePanel />
          <CapturePanel />
          <WeaponPanel />
          <vk-group :config="{ x: 810, y: 790 }">
             <vk-rect :config="{ x: 0, y: 0, fill: 'grey', width: 600, height: 110, cornerRadius: 6, shadowBlur: 10 }"></vk-rect>
          <vk-text :config="{
            x: 10,
            y: 0,
            height: 110,
            verticalAlign: 'middle',
            text: 'А',
            fontFamily: 'Russo One, sans-serif',
            fill: '#181818'
          }"/>
          <SAMPotentiometer :x="40" :y="30" big :delta-value="1" @change="targetRadar.incrementTargetCursorAzimut"/>
           <vk-text :config="{
            x: 210,
            y: 0,
            height: 110,
            verticalAlign: 'middle',
            text: 'В',
            fontFamily: 'Russo One, sans-serif',
            fill: '#181818'
          }"/>
          <SAMPotentiometer :x="240" :y="30" big :delta-value="0.5" @change="targetRadar.incrementTargetCursorElevation"/>
          <vk-text :config="{
            x: 410,
            y: 0,
            height: 110,
            verticalAlign: 'middle',
            text: 'Д',
            fontFamily: 'Russo One, sans-serif',
            fill: '#181818'
          }"/>
          <SAMPotentiometer :x="440" :y="30" big :delta-value="1" @change="targetRadar.incrementTargetCursorDistance"/>
          </vk-group >
         
        </vk-layer>
        <vk-layer>
          <MainRadarDisplay v-if="mainRadar.viewMode === ViewModes.MainRadar" />
          <TargetRadarDisplay v-if="mainRadar.viewMode === ViewModes.TargetRadar" />
          <BIPDisplay v-if="mainRadar.viewMode === ViewModes.BIP"/>
        </vk-layer>
      </vk-stage>
    </div>

  </v-container>
</template>

<script setup lang="ts">
import MainRadarPanel from './MainRadarPanel.vue';
import ParamsPanel from './ParamsPanel.vue';
import SupplyPanel from './SupplyPanel.vue';
import WeaponPanel from './WeaponPanel.vue';
import CapturePanel from './CapturePanel.vue';
import MainRadarDisplay from './MainRadarDisplay.vue';
import TargetRadarDisplay from './TargetRadarDisplay.vue';
import BIPDisplay from './BIPDisplay.vue';
import DistancePanel from './DistancePanel.vue';
import SAMPotentiometer from './SAMPotentiometer.vue';
import { useMainRadarStore, ViewModes } from '@/store/mainRadarPanel';
import { useTargetRadarStore } from '@/store/targetRadar';

const mainRadar = useMainRadarStore()
const targetRadar = useTargetRadarStore()
</script>