import type FlightObject from "./FlightObject";
import type SAMissile from "./SAMissile";
import type SNRDistanceScreen from "./SNRDistanceScreen";
import type SNRIndicatorsScreen from "./SNRIndicatorsScreen";
import type SNRTargetScreen from "./SNRTargetScreen";

type EventListener = (arg0: string, arg1: any) => void;

interface ISNR {
  snrTargetScreen: SNRTargetScreen;
  snrIndicatorsScreen: SNRIndicatorsScreen;
  snrDistanceScreen: SNRDistanceScreen;
  eventListener: EventListener;
  distanceDetectRange: number;
  initialDistance: number;
  initialRayWidth: number;
  maxDistance: number;
}
export default class SNR {
  private snrTargetScreen: SNRTargetScreen | null = null;
  private snrIndicatorsScreen: SNRIndicatorsScreen | null = null;
  private snrDistanceScreen: SNRDistanceScreen | null = null;
  private azimut = -Math.PI / 2; // rad
  private verticalAngle = 0; // rad
  private targetDistance = 0; // km
  private minVerticalAngle = -5; // degree
  private maxVerticalAngle = 75; // degree
  private maxDistance = 0;
  private flightObjects: FlightObject[] = [];
  private rayWidth = 0; // degree
  private distanceTrackingAccuracy = 0.2; // km
  private distanceDetectRange = 0; // km

  private radarHeight = 36; /// m
  private trackTargetInterval: number | null = null;
  private trackTargetDistanceInterval: number | null = null;
  private trackingTargetIdentifier: string | null = null;
  private eventListener: EventListener | null = null;
  private missiles: SAMissile[] = [];
  constructor({
    snrTargetScreen,
    snrIndicatorsScreen,
    snrDistanceScreen,
    eventListener,
    distanceDetectRange,
    initialDistance,
    initialRayWidth,
    maxDistance,
  }: ISNR) {
    this.snrTargetScreen = snrTargetScreen;
    this.snrIndicatorsScreen = snrIndicatorsScreen;
    this.snrDistanceScreen = snrDistanceScreen;
    this.eventListener = eventListener;
    this.distanceDetectRange = distanceDetectRange;
    this.targetDistance = initialDistance;
    this.rayWidth = initialRayWidth;
    this.maxDistance = maxDistance;

    const interval = setInterval(() => {
      this.calculateTargetsParams();
      this.calculateMissiles();
    }, 0);
  }

  get trackedTarget(): FlightObject | null {
    return this.flightObjects.find((fo) =>
      fo.identifier === this.trackingTargetIdentifier
    ) || null;
  }

  get azimutDeg() {
    const azimut = (this.azimut + Math.PI / 2) * (180 / Math.PI);
    return azimut < 0 ? azimut + 360 : azimut;
  }

  setAzimut(azimut: number) { // degree
    if (azimut > 360) {
      azimut = azimut - 360;
    }
    if (azimut < 0) {
      azimut = 360 + azimut;
    }

    if (azimut > 270) {
      azimut = azimut - 360;
    }

    this.azimut = (azimut - 90) * Math.PI / 180;
    this.snrIndicatorsScreen!.setAzimut(this.azimut);
  }

  get verticalAngleDeg() {
    return this.verticalAngle * (180 / Math.PI);
  }

  setVerticalAngle(verticalAngle: number) { // degree
    if (
      verticalAngle > this.minVerticalAngle &&
      verticalAngle < this.maxVerticalAngle
    ) {
      this.verticalAngle = verticalAngle * Math.PI / 180;
      this.snrIndicatorsScreen!.setVerticalAngle(this.verticalAngle);
    }
  }

  get radarRayWidth() {
    return this.rayWidth;
  }

  setRadarRayWidth(deg: number) {
    this.rayWidth = deg;
  }

  public addFlightObject(flightObject: FlightObject) {
    this.flightObjects.push(flightObject);
  }

  private calculateTargetsParams() {
    for (const flightObject of this.flightObjects) {
      if (flightObject.isLaunched && !flightObject.isDestroyed) {
        // Distance from SNR to target
        const targetDistance = Math.hypot(
          flightObject.currentPoint.x,
          flightObject.currentPoint.y,
        );
        // Azimut from SNR to target
        const targetAzimutAngle = Math.atan2(
          flightObject.currentPoint.y,
          flightObject.currentPoint.x,
        );
        // Difference from SNR and target heights
        const targetHeightOffset = flightObject.currentPoint.z -
          this.radarHeight / 1000;
        // Vertical angle from SNR to target
        const targetVerticalAngle = (targetHeightOffset / targetDistance);

        // Angle of ray of SNR
        const rayWidthRad = this.rayWidth * Math.PI / 180;
        // Difference of SNR azimut and target azimut
        const targetAzimutOffset = this.azimut - targetAzimutAngle;
        // Difference of SNR vertical angle and target vertical angle
        const targetVerticalOffset = targetVerticalAngle - this.verticalAngle;

        // If target inside of SNR ray
        if (
          Math.abs(targetAzimutOffset) < (rayWidthRad / 2) &&
          Math.abs(targetVerticalOffset) < (rayWidthRad / 2)
        ) {
          // Calculate target position on canvas
          const targetOffsetX = -(targetAzimutOffset / rayWidthRad * 2);
          const targetOffsetY = -(targetVerticalOffset / rayWidthRad * 2);

          const rayWidth = ((Math.PI * rayWidthRad * targetDistance) / 180);
          const targetSize = 2 * Math.sqrt(flightObject.rcs / Math.PI) / 1000; // Size in km; rcs converted to diameter of circle with same scale
          const targetSpotSize = targetSize / rayWidth;
          const targetVisibilityK = targetDistance / this.maxDistance;
          this.snrTargetScreen!.setTargetParams(
            flightObject.identifier!,
            targetVisibilityK,
            targetSpotSize,
            targetOffsetX,
            targetOffsetY,
          );
          const targetSpotLength = (targetSpotSize +
            (this.distanceTrackingAccuracy * Math.random())) * rayWidth;
          this.snrDistanceScreen!.setTargetParams(
            flightObject.identifier!,
            targetVisibilityK,
            targetDistance,
            targetSpotSize,
            targetSpotLength,
          );
        } else {
          this.snrTargetScreen!.removeTarget(flightObject.identifier!);
          this.snrDistanceScreen!.removeTarget(flightObject.identifier!);
        }
      }

      if (
        flightObject.identifier === this.trackingTargetIdentifier &&
        this.trackTargetInterval && this.trackTargetDistanceInterval &&
        this.eventListener
      ) {
        this.eventListener("targetDistance", this.targetDistance.toFixed(1));
        this.eventListener("targetVelocity", flightObject.velocity);
        this.eventListener(
          "targetHeight",
          (Math.abs(flightObject.currentPoint.z * 1000)).toFixed(0),
        );
      }
      if (
        flightObject.isDestroyed &&
        this.trackingTargetIdentifier === flightObject.identifier
      ) {
        this.resetCaptureTargetByDirection();
        this.resetCaptureTargetByDistance();
        this.snrTargetScreen!.removeTarget(flightObject.identifier!);
        this.snrDistanceScreen!.removeTarget(flightObject.identifier!);
      }
    }
  }

  private trackTargetByDirection(flightObject: FlightObject) {
    this.trackTargetInterval && clearInterval(this.trackTargetInterval);
    this.trackingTargetIdentifier = flightObject.identifier;
    this.trackTargetInterval = setInterval(() => {
      // Azimut from SNR to target
      const targetAzimutAngle = Math.atan2(
        flightObject.currentPoint.y,
        flightObject.currentPoint.x,
      );

      // Difference from SNR and target heights
      const targetHeightOffset = flightObject.currentPoint.z -
        this.radarHeight / 1000;

      // Distance from SNR to target
      const targetDistance = Math.hypot(
        flightObject.currentPoint.x,
        flightObject.currentPoint.y,
      );
      // Vertical angle from SNR to target
      const targetVerticalAngle = (targetHeightOffset / targetDistance);

      if (
        targetVerticalAngle < this.minVerticalAngle * Math.PI / 180 ||
        targetVerticalAngle > this.maxVerticalAngle * Math.PI / 180
      ) {
        this.resetCaptureTargetByDirection();
        this.resetCaptureTargetByDistance();
      }

      this.azimut = targetAzimutAngle;
      this.verticalAngle = targetVerticalAngle;
    }, 0);
  }

  captureTargetByDirection() {
    this.flightObjects.forEach((flightObject) => {
      // Azimut from SNR to target
      const targetAzimutAngle = Math.atan2(
        flightObject.currentPoint.y,
        flightObject.currentPoint.x,
      );
      // Distance from SNR to target
      const targetDistance = Math.hypot(
        flightObject.currentPoint.x,
        flightObject.currentPoint.y,
      );
      // Angle of ray of SNR
      const rayWidthRad = this.rayWidth * Math.PI / 180;
      const rayWidth = ((Math.PI * rayWidthRad * targetDistance) / 180);
      // Azimut of target spot
      const targetSpotAngle = ((2 * Math.sqrt(flightObject.rcs / Math.PI) /
        1000) /
        targetDistance) / rayWidth;

      const isCapturedByAzimut = Math.abs(this.azimut - targetAzimutAngle) <
        Math.abs(targetSpotAngle) * 2;

      // Difference from SNR and target heights
      const targetHeightOffset = flightObject.currentPoint.z -
        this.radarHeight / 1000;
      // Vertical angle from SNR to target
      const targetVerticalAngle = (targetHeightOffset / targetDistance);
      const isCapturedByVerticalAngle =
        Math.abs(this.verticalAngle - targetVerticalAngle) <
          Math.abs(targetSpotAngle);
      if (isCapturedByAzimut && isCapturedByVerticalAngle) {
        this.trackTargetByDirection(flightObject);
        this.eventListener &&
          this.eventListener("isCapturedByDirection", true);
      }
    });
  }

  resetCaptureTargetByDirection() {
    this.trackTargetInterval && clearInterval(this.trackTargetInterval);
    this.trackTargetInterval = null;
    this.trackingTargetIdentifier = null;
    this.eventListener && this.eventListener("isCapturedByDirection", false);
    this.missiles.forEach((missile) => missile.destroyMissile());
    this.resetCaptureTargetByDistance();
  }

  get indicatorTargetDistance() {
    return this.targetDistance;
  }

  setIndicatorTargetDistance(distance: number) {
    if (distance > 0 && distance < this.maxDistance) {
      this.targetDistance = distance;
      this.snrDistanceScreen?.setDistance(distance);
    }
  }

  captureTargetByDistance() {
    this.flightObjects.forEach((flightObject) => {
      // Distance from SNR to target
      const targetDistance = Math.hypot(
        flightObject.currentPoint.x,
        flightObject.currentPoint.y,
      );

      if (
        Math.abs(targetDistance - this.targetDistance) <
          this.distanceDetectRange &&
        this.trackingTargetIdentifier === flightObject.identifier
      ) {
        this.trackTargetByDistance();
        this.eventListener &&
          this.eventListener("isCapturedByDistance", true);
      }
    });
  }

  resetCaptureTargetByDistance() {
    this.trackTargetDistanceInterval &&
      clearInterval(this.trackTargetDistanceInterval);
    this.trackTargetDistanceInterval = null;
    this.eventListener && this.eventListener("isCapturedByDistance", false);
  }

  private trackTargetByDistance() {
    this.trackTargetDistanceInterval &&
      clearInterval(this.trackTargetDistanceInterval);

    const flightObject = this.flightObjects.find((flightObject) =>
      flightObject.identifier === this.trackingTargetIdentifier
    )!;
    this.trackTargetDistanceInterval = setInterval(() => {
      // Distance from SNR to target
      const targetDistance = Math.hypot(
        flightObject.currentPoint.x,
        flightObject.currentPoint.y,
      );

      if (
        targetDistance > this.maxDistance
      ) {
        this.resetCaptureTargetByDirection();
        this.resetCaptureTargetByDistance();
      }

      this.targetDistance = targetDistance;
      this.snrDistanceScreen!.setDistance(targetDistance);
    }, 0);
  }

  addMissile(missile: SAMissile) {
    this.missiles.push(missile);
  }

  private calculateMissiles() {
    for (let missile of this.missiles) {
      if (!missile.isDestroyedMissile) {
        // Distance from SNR to missile
        const missileDistance = Math.hypot(
          missile.missileCurrentPoint.x,
          missile.missileCurrentPoint.y,
        );
        // Azimut from SNR to target
        const missileAzimutAngle = Math.atan2(
          missile.missileCurrentPoint.y,
          missile.missileCurrentPoint.x,
        );
        // Difference from SNR and target heights
        const missileHeightOffset = missile.missileCurrentPoint.z -
          this.radarHeight / 1000;
        // Vertical angle from SNR to target
        const missileVerticalAngle = (missileHeightOffset / missileDistance);

        // Angle of ray of SNR
        const rayWidthRad = this.rayWidth * Math.PI / 180;
        // Difference of SNR azimut and target azimut
        const missileAzimutOffset = this.azimut - missileAzimutAngle;
        // Difference of SNR vertical angle and target vertical angle
        const missileVerticalOffset = missileVerticalAngle -
          this.verticalAngle;

        // Calculate missile offsets
        const missileOffsetX = -(missileAzimutOffset / rayWidthRad * 2);
        const missileOffsetY = -(missileVerticalOffset / rayWidthRad * 2);
        this.snrTargetScreen?.setMissileParams(
          missile.indentifier!,
          missileOffsetX,
          missileOffsetY,
        );
        this.snrDistanceScreen?.setMissileParams(
          missile.indentifier!,
          missileDistance,
        );
      } else {
        this.snrTargetScreen?.removeMissile(missile.indentifier!);
        this.snrDistanceScreen?.removeMissile(missile.indentifier!);
      }
    }
  }
}
