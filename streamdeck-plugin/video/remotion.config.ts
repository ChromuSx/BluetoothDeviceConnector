import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/index.ts");
Config.setCodec("h264");
Config.setChromiumOpenGlRenderer("angle");
