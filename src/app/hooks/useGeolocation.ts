"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(watchPosition: boolean = true) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let message: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "位置情報の使用が許可されていません。ブラウザの設定から許可してください。";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "位置情報を取得できません。GPSが有効か確認してください。";
        break;
      case error.TIMEOUT:
        message = "位置情報の取得がタイムアウトしました。再試行してください。";
        break;
      default:
        message = "位置情報の取得中にエラーが発生しました。";
    }
    setState((prev) => ({
      ...prev,
      error: message,
      loading: false,
    }));
  }, []);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "お使いのブラウザは位置情報に対応していません。",
        loading: false,
      }));
      return;
    }
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, [updatePosition, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: "お使いのブラウザは位置情報に対応していません。",
        loading: false,
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    };

    // まず現在位置を取得
    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      options
    );

    // 歩行中の位置更新を監視
    let watchId: number | undefined;
    if (watchPosition) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        { ...options, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchPosition, updatePosition, handleError]);

  return { ...state, retry };
}
