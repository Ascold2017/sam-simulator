import Sounds from "@/classes/Sounds";
import { defineStore } from "pinia";
import { useCapturePanelStore } from "./capturePanel";
import { useMainRadarStore } from "./mainRadarPanel";
import { useTargetRadarStore } from "./targetRadar";
import { useTargetsStore } from "./targets";
import { useWeaponPanelStore } from "./weaponPanel";

export const useSupplyPanelStore = defineStore("supply", {
  state: () => ({
    isEnabledPower: false,
    isEnabledMainRadar: false,
    isEnabledTargetRadarTransmitter: false,
  }),

  actions: {
    setDefaultValues() {
      this.isEnabledPower = false;
      this.isEnabledMainRadar = false;
      this.isEnabledTargetRadarTransmitter = false;
    },
    setEnabledPower(value: boolean) {
      const mainRadar = useMainRadarStore();
      const targetRadar = useTargetRadarStore();
      const capturePanel = useCapturePanelStore();
      const targets = useTargetsStore()
      const weaponPanel = useWeaponPanelStore()
      if (value) {
        Sounds.startEngine();
        const i = setTimeout(() => {
          this.isEnabledPower = true;
          //@ts-ignore
          this.sam.setIsEnabled(true);
          clearTimeout(i);
        }, 3000);
      } else {
        Sounds.stopEngine();
        //@ts-ignore
        this.sam.setIsEnabled(false);
        this.setDefaultValues();
        mainRadar.setDefaultValues();
        capturePanel.setDefaultValues();
        targetRadar.setDefaultValues();
        targets.setTargets([], []);
        weaponPanel.setDefaultValues()
      }
    },
    setEnablerMainRadar(value: boolean) {
      if (!this.isEnabledPower) return;
      if (value) {
        const i = setTimeout(() => {
          this.isEnabledMainRadar = true;
          clearTimeout(i);
        }, 1000);
      } else {
        this.isEnabledMainRadar = false;
      }
    },
    setIsEnabledTargetRadarTransmitter(value: boolean) {
      if (!this.isEnabledPower) return;
      if (value) {
        const i = setTimeout(() => {
          this.isEnabledTargetRadarTransmitter = true;
          clearTimeout(i);
        }, 500);
      } else {
        this.isEnabledTargetRadarTransmitter = false;
      }
    },
  },
});
