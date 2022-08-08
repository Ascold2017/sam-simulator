import type FlightObject from "./FlightObject";
import type SAMissile from "./SAMissile";

const SAM_PARAMS = {
  RADAR_HEIGHT: 0.025, // 25 meters
  MIN_ELEVATION: 0,
  MAX_ELEVATION: 50 * (Math.PI / 180),
  MAX_DISTANCE: 50, // 50 km
};

interface IRecognizedTargets {
  distance: number;
  azimut: number;
  elevation: number;
  radialVelocity: number;
  velocity: number;
  height: number;
  param: number;
  x: number;
  y: number;
  rotation: number;
  size: number;
}

interface IFlightMissiles {
  x: number;
  y: number;
  z: number;
  velocity: number;
}

export default class SAM {
  private isEnabled = false;

  private flightObjects: FlightObject[] = [];
  private missiles: SAMissile[] = [];

  private recognizedTargets: Record<string, IRecognizedTargets> = {};
  private flightMissiles: Record<string, IFlightMissiles> = {};

  constructor(eventListener: Function) {
    this.tick(eventListener);
  }

  public setIsEnabled(value: boolean) {
    this.isEnabled = value;
  }

  public addFlightObject(flightObject: FlightObject) {
    this.flightObjects.push(flightObject);
  }

  private tick(eventListener: Function) {
    setInterval(() => {
      if (this.isEnabled) {
        this.recalculateTargets();
        this.recalculateMissiles();
        eventListener({
          targets: { ...this.recognizedTargets },
          missiles: { ...this.flightMissiles },
        });
      }
    });
  }

  private isInVision(flightObject: FlightObject, targetDistance: number) {
    const height = flightObject.currentPoint.z;
    return Math.sqrt(2 * 6371.009 * SAM_PARAMS.RADAR_HEIGHT) +
        Math.sqrt(2 * 6371.009 * height) > targetDistance;
  }

  private recalculateTargets() {
    for (const flightObject of this.flightObjects) {
      if (!flightObject.isLaunched) continue;
      if (!flightObject.isDestroyed) {
        // Distance from SNR to target
        const targetDistance = Math.hypot(
          flightObject.currentPoint.x,
          flightObject.currentPoint.y,
        );
        // Azimut from SNR to target
        const targetAzimut = Math.atan2(
          flightObject.currentPoint.y,
          flightObject.currentPoint.x,
        );
        // Difference from SNR and target heights
        const targetHeightOffset = flightObject.currentPoint.z -
          SAM_PARAMS.RADAR_HEIGHT;
        // Vertical angle from SNR to target
        const targetElevation = (targetHeightOffset / targetDistance);

        // Angle between azimut to flight object and rotation of flight object
        const targetAngle = (targetAzimut > flightObject.currentRotation
          ? targetAzimut - flightObject.currentRotation
          : flightObject.currentRotation - targetAzimut) - Math.PI;

        // Radial velocity
        const radialVelocity = flightObject.velocity * Math.cos(targetAngle);
        // Is visible from horizont
        const isTargetVisible = this.isInVision(flightObject, targetDistance);

        // Target param
        const targetParam = Math.abs(targetDistance * Math.tan(targetAngle));
        // Target size
        // Size in km; rcs converted to diameter of circle with same scale
        const targetSize = 2 * Math.sqrt(flightObject.rcs / Math.PI) / 1000;

        const inAllowedElevation = targetElevation > SAM_PARAMS.MIN_ELEVATION &&
          targetElevation < SAM_PARAMS.MAX_ELEVATION;

        if (isTargetVisible && inAllowedElevation) {
          this.recognizedTargets[flightObject.identifier!] = {
            distance: targetDistance,
            azimut: targetAzimut,
            elevation: targetElevation,
            radialVelocity,
            velocity: flightObject.currentPoint.v,
            height: flightObject.currentPoint.z,
            param: targetParam,
            x: flightObject.currentPoint.x,
            y: flightObject.currentPoint.y,
            rotation: flightObject.currentRotation,
            size: targetSize
          };
        } else {
          delete this.recognizedTargets[flightObject.identifier!];
        }
      } else {
        delete this.recognizedTargets[flightObject.identifier!];
      }
    }
  }

  private recalculateMissiles() {
    for (let missile of this.missiles) {
      if (!missile.isDestroyedMissile) {
        this.flightMissiles[missile.identifier!] = {
          x: missile.missileCurrentPoint.x,
          y: missile.missileCurrentPoint.y,
          z: missile.missileCurrentPoint.z,
          velocity: missile.velocity,
        };
      } else {
        delete this.flightMissiles[missile.identifier!];
      }
    }
  }
}
