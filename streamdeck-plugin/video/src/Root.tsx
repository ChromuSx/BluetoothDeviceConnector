import React from "react";
import { Composition, Still } from "remotion";
import { BluetoothPromo } from "./BluetoothPromo";
import { Thumbnail } from "./components/Thumbnail";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BluetoothPromo"
        component={BluetoothPromo}
        durationInFrames={1620}
        fps={60}
        width={1920}
        height={1080}
      />
      <Still
        id="BluetoothThumbnail"
        component={Thumbnail}
        width={1920}
        height={960}
      />
    </>
  );
};
